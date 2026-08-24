"""Order controller."""
import hashlib
import hmac
import os
import time
from typing import Any

from bson import ObjectId
from bson.errors import InvalidId

from config.db import get_db
from config.razorpay_config import razorpay_client
from models.order import new_tracking_id
from utils.errors import AppError

ALLOWED_ORDER_STATUSES = {"Processing", "Confirmed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"}
CANCELLABLE_STATUSES = {"Processing", "Confirmed"}


def _money(value: Any, field: str) -> float:
    try:
        amount = float(value or 0)
    except (TypeError, ValueError):
        raise AppError(400, f"Invalid {field}")
    if amount < 0:
        raise AppError(400, f"{field} cannot be negative")
    return round(amount, 2)


async def create_razorpay_order(amount: float) -> dict:
    amount = _money(amount, "amount")
    if amount <= 0:
        raise AppError(400, "Amount must be greater than zero")

    options = {
        "amount": int(round(amount * 100)),
        "currency": "INR",
        "receipt": f"receipt_{int(time.time() * 1000)}",
    }
    return razorpay_client.order.create(data=options)


async def verify_razorpay_payment(
    razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str
) -> dict:
    if not razorpay_order_id or not razorpay_payment_id or not razorpay_signature:
        raise AppError(400, "Payment verification data is incomplete")

    secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not secret:
        raise AppError(500, "Payment service is not configured")

    body = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        secret.encode("utf-8"), body.encode("utf-8"), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, razorpay_signature):
        raise AppError(400, "Invalid payment signature")

    try:
        razorpay_order = razorpay_client.order.fetch(razorpay_order_id)
        payment = razorpay_client.payment.fetch(razorpay_payment_id)
    except Exception:
        raise AppError(400, "Unable to verify payment with payment provider")

    if str(payment.get("order_id")) != str(razorpay_order_id):
        raise AppError(400, "Payment does not belong to the Razorpay order")

    if payment.get("status") != "captured":
        raise AppError(400, "Payment has not been captured")

    return {
        "success": True,
        "razorpayOrderId": razorpay_order["id"],
        "razorpayPaymentId": payment["id"],
        "amount": int(payment["amount"]),
        "currency": payment.get("currency", "INR"),
    }


def _format_address(address: Any) -> str:
    if isinstance(address, dict):
        parts = [
            address.get("houseNumber", ""),
            address.get("locality", ""),
            address.get("landmark", ""),
            address.get("district", ""),
            address.get("state", ""),
            f"- {address.get('pincode', '')}",
        ]
        return "\n".join(part for part in parts if part).strip()
    if isinstance(address, str) and address.strip():
        return address.strip()
    raise AppError(400, "Address is required")


async def _reserve_stock(db, product_oid: ObjectId, quantity: int, product_name: str) -> None:
    result = await db.products.update_one(
        {"_id": product_oid, "stock": {"$gte": quantity}},
        {"$inc": {"stock": -quantity}},
    )
    if result.modified_count != 1:
        raise AppError(400, f"{product_name} is out of stock")


async def create_order(
    current_user: dict,
    items: list,
    subtotal: float,
    discount: float,
    delivery_charge: float,
    total_amount: float,
    coupon_used: str | None,
    payment_method: str | None,
    address: Any,
    razorpay_order_id: str | None = None,
    razorpay_payment_id: str | None = None,
) -> dict:
    db = get_db()

    if not current_user or not current_user.get("_id"):
        raise AppError(401, "User not authenticated")
    if not isinstance(items, list) or not items:
        raise AppError(400, "Cart is empty")

    payment_method = (payment_method or "COD").upper()
    if payment_method not in {"COD", "ONLINE"}:
        raise AppError(400, "Invalid payment method")

    if payment_method == "ONLINE" and (not razorpay_order_id or not razorpay_payment_id):
        raise AppError(400, "Verified payment identifiers are required")

    normalized_items = []
    reserved_stock = []
    calculated_subtotal = 0.0

    try:
        for item in items:
            if not isinstance(item, dict):
                raise AppError(400, "Invalid cart item")

            raw_product = item.get("product")
            product_id = raw_product.get("_id") if isinstance(raw_product, dict) else raw_product
            try:
                product_oid = ObjectId(product_id)
            except (InvalidId, TypeError):
                raise AppError(404, "Product not found")

            quantity = item.get("quantity")
            if not isinstance(quantity, int) or isinstance(quantity, bool) or quantity <= 0:
                raise AppError(400, "Quantity must be a positive integer")

            product = await db.products.find_one({"_id": product_oid})
            if not product:
                raise AppError(404, "Product not found")

            await _reserve_stock(db, product_oid, quantity, product["name"])
            reserved_stock.append((product_oid, quantity))

            calculated_subtotal += float(product["price"]) * quantity
            normalized_items.append({
                "product": product_oid,
                "quantity": quantity,
                "unitPrice": float(product["price"]),
            })

        calculated_subtotal = round(calculated_subtotal, 2)
        requested_discount = _money(discount, "discount")
        requested_delivery = _money(delivery_charge, "delivery charge")

        if requested_discount > calculated_subtotal:
            raise AppError(400, "Discount cannot exceed subtotal")

        calculated_total = round(calculated_subtotal - requested_discount + requested_delivery, 2)
        client_total = _money(total_amount, "total amount")

        if abs(client_total - calculated_total) > 0.01:
            raise AppError(400, "Order total does not match product prices")

        payment_status = "Pending"
        payment_amount = None

        if payment_method == "ONLINE":
            try:
                razorpay_order = razorpay_client.order.fetch(razorpay_order_id)
                payment = razorpay_client.payment.fetch(razorpay_payment_id)
            except Exception:
                raise AppError(400, "Unable to verify payment with payment provider")

            if str(razorpay_order.get("id")) != str(razorpay_order_id):
                raise AppError(400, "Invalid Razorpay order")
            if str(payment.get("order_id")) != str(razorpay_order_id):
                raise AppError(400, "Payment does not belong to the order")
            if payment.get("status") != "captured":
                raise AppError(400, "Payment has not been captured")
            if int(razorpay_order.get("amount", 0)) != int(round(calculated_total * 100)):
                raise AppError(400, "Payment amount does not match order total")
            if int(payment.get("amount", 0)) != int(round(calculated_total * 100)):
                raise AppError(400, "Captured payment amount does not match order total")

            payment_status = "Paid"
            payment_amount = int(payment["amount"])

        import datetime
        now = datetime.datetime.utcnow()

        order_doc = {
            "user": current_user["_id"],
            "items": normalized_items,
            "subtotal": calculated_subtotal,
            "discount": requested_discount,
            "deliveryCharge": requested_delivery,
            "totalAmount": calculated_total,
            "couponUsed": coupon_used,
            "paymentMethod": payment_method,
            "paymentStatus": payment_status,
            "razorpayOrderId": razorpay_order_id,
            "razorpayPaymentId": razorpay_payment_id,
            "paymentAmountPaise": payment_amount,
            "address": _format_address(address),
            "orderStatus": "Processing",
            "trackingId": new_tracking_id(),
            "createdAt": now,
            "updatedAt": now,
        }

        # Prevent duplicate internal orders for the same Razorpay payment.
        if razorpay_payment_id:
            existing = await db.orders.find_one({"razorpayPaymentId": razorpay_payment_id})
            if existing:
                raise AppError(409, "Payment has already been used for an order")

        result = await db.orders.insert_one(order_doc)
        order_doc["_id"] = result.inserted_id

        await db.carts.update_one(
            {"user": current_user["_id"]},
            {"$set": {"items": []}},
            upsert=False,
        )
        return order_doc

    except Exception:
        for product_oid, quantity in reserved_stock:
            await db.products.update_one(
                {"_id": product_oid},
                {"$inc": {"stock": quantity}},
            )
        raise


async def _populate_order_items(order: dict) -> dict:
    if not order:
        return order

    db = get_db()
    for item in order.get("items", []):
        item["product"] = await db.products.find_one({"_id": item["product"]})
    return order


async def get_user_orders(current_user: dict) -> list:
    db = get_db()
    cursor = db.orders.find({"user": current_user["_id"]}).sort("createdAt", -1)
    orders = [o async for o in cursor]
    for order in orders:
        await _populate_order_items(order)
    return orders


async def get_single_order(current_user: dict, order_id: str) -> dict:
    db = get_db()
    try:
        oid = ObjectId(order_id)
    except (InvalidId, TypeError):
        raise AppError(404, "Resource not found")

    order = await db.orders.find_one({"_id": oid})
    if not order:
        raise AppError(404, "Order not found")
    if str(order["user"]) != str(current_user["_id"]):
        raise AppError(403, "Not authorized")

    return await _populate_order_items(order)


async def cancel_order(current_user: dict, order_id: str) -> dict:
    db = get_db()
    try:
        oid = ObjectId(order_id)
    except (InvalidId, TypeError):
        raise AppError(404, "Resource not found")

    order = await db.orders.find_one({"_id": oid})
    if not order:
        raise AppError(404, "Order not found")
    if str(order["user"]) != str(current_user["_id"]):
        raise AppError(403, "Not authorized")
    if order["orderStatus"] not in CANCELLABLE_STATUSES:
        raise AppError(400, "Order cannot be cancelled now")

    result = await db.orders.update_one(
        {"_id": oid, "orderStatus": {"$in": list(CANCELLABLE_STATUSES)}},
        {"$set": {"orderStatus": "Cancelled", "updatedAt": __import__('datetime').datetime.utcnow()}},
    )
    if result.modified_count != 1:
        raise AppError(409, "Order was already updated")

    for item in order.get("items", []):
        await db.products.update_one(
            {"_id": item["product"]},
            {"$inc": {"stock": int(item["quantity"])}},
        )

    return {"message": "Order cancelled successfully"}


async def update_order_status(order_id: str, status: str) -> dict:
    db = get_db()
    status = (status or "").strip()
    if status not in ALLOWED_ORDER_STATUSES:
        raise AppError(400, "Invalid order status")

    try:
        oid = ObjectId(order_id)
    except (InvalidId, TypeError):
        raise AppError(404, "Resource not found")

    order = await db.orders.find_one({"_id": oid})
    if not order:
        raise AppError(404, "Order not found")
    if order["orderStatus"] == "Cancelled":
        raise AppError(400, "Cancelled order cannot change status")
    if order["orderStatus"] == "Delivered" and status != "Delivered":
        raise AppError(400, "Delivered order cannot move backwards")

    await db.orders.update_one(
        {"_id": oid},
        {"$set": {"orderStatus": status, "updatedAt": __import__('datetime').datetime.utcnow()}},
    )
    return {"message": "Order status updated"}
