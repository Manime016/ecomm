"""Order and payment controller."""
import datetime
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
PENDING_PAYMENT_MINUTES = 15


def _money(value: Any, field: str) -> float:
    try:
        amount = float(value or 0)
    except (TypeError, ValueError):
        raise AppError(400, f"Invalid {field}")
    if amount < 0:
        raise AppError(400, f"{field} cannot be negative")
    return round(amount, 2)


def _format_address(address: Any) -> str:
    if isinstance(address, dict):
        parts = [address.get("houseNumber", ""), address.get("locality", ""), address.get("landmark", ""), address.get("district", ""), address.get("state", ""), f"- {address.get('pincode', '')}"]
        return "\n".join(part for part in parts if part).strip()
    if isinstance(address, str) and address.strip():
        return address.strip()
    raise AppError(400, "Address is required")


async def _reserve_stock(db, product_oid: ObjectId, quantity: int, product_name: str) -> None:
    result = await db.products.update_one({"_id": product_oid, "stock": {"$gte": quantity}}, {"$inc": {"stock": -quantity}})
    if result.modified_count != 1:
        raise AppError(400, f"{product_name} is out of stock")


async def _release_stock(db, items: list) -> None:
    for item in items:
        await db.products.update_one({"_id": item["product"]}, {"$inc": {"stock": int(item["quantity"])}})


async def _build_and_reserve_items(db, items: list) -> tuple[list, list, float]:
    if not isinstance(items, list) or not items:
        raise AppError(400, "Cart is empty")
    normalized, reserved, subtotal = [], [], 0.0
    try:
        for item in items:
            raw_product = item.get("product") if isinstance(item, dict) else None
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
            reserved.append((product_oid, quantity))
            subtotal += float(product["price"]) * quantity
            normalized.append({"product": product_oid, "quantity": quantity, "unitPrice": float(product["price"])})
        return normalized, reserved, round(subtotal, 2)
    except Exception:
        for product_oid, quantity in reserved:
            await db.products.update_one({"_id": product_oid}, {"$inc": {"stock": quantity}})
        raise


async def create_razorpay_order(payload: dict, current_user: dict) -> dict:
    """Reserve stock and create a pending internal order before payment."""
    db = get_db()
    normalized, reserved, subtotal = await _build_and_reserve_items(db, payload.get("items"))
    discount = _money(payload.get("discount", 0), "discount")
    delivery = _money(payload.get("deliveryCharge", 0), "delivery charge")
    if discount > subtotal:
        await _release_stock(db, [{"product": p, "quantity": q} for p, q in reserved])
        raise AppError(400, "Discount cannot exceed subtotal")
    total = round(subtotal - discount + delivery, 2)
    client_total = _money(payload.get("totalAmount"), "total amount")
    if abs(client_total - total) > 0.01:
        await _release_stock(db, [{"product": p, "quantity": q} for p, q in reserved])
        raise AppError(400, "Order total does not match product prices")
    try:
        razorpay_order = razorpay_client.order.create(data={"amount": int(round(total * 100)), "currency": "INR", "receipt": f"receipt_{int(time.time() * 1000)}"})
        now = datetime.datetime.utcnow()
        doc = {"user": current_user["_id"], "items": normalized, "subtotal": subtotal, "discount": discount, "deliveryCharge": delivery, "totalAmount": total, "couponUsed": payload.get("couponUsed"), "paymentMethod": "ONLINE", "paymentStatus": "Pending", "razorpayOrderId": razorpay_order["id"], "razorpayPaymentId": None, "paymentAmountPaise": None, "address": _format_address(payload.get("address")), "orderStatus": "Payment Pending", "trackingId": new_tracking_id(), "paymentExpiresAt": now + datetime.timedelta(minutes=PENDING_PAYMENT_MINUTES), "createdAt": now, "updatedAt": now}
        result = await db.orders.insert_one(doc)
        doc["_id"] = result.inserted_id
        return razorpay_order
    except Exception:
        await _release_stock(db, [{"product": p, "quantity": q} for p, q in reserved])
        raise


async def verify_razorpay_payment(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str, current_user: dict) -> dict:
    db = get_db()
    pending = await db.orders.find_one({"razorpayOrderId": razorpay_order_id, "user": current_user["_id"]})
    if not pending:
        raise AppError(404, "Pending order not found")
    if pending.get("paymentStatus") == "Paid":
        return {"success": True, "message": "Payment already processed", "orderId": str(pending["_id"])}
    if pending.get("paymentExpiresAt") and pending["paymentExpiresAt"] < datetime.datetime.utcnow():
        await db.orders.update_one({"_id": pending["_id"], "paymentStatus": "Pending"}, {"$set": {"paymentStatus": "Expired", "orderStatus": "Cancelled", "updatedAt": datetime.datetime.utcnow()}})
        await _release_stock(db, pending.get("items", []))
        raise AppError(400, "Payment session expired")

    secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not secret:
        raise AppError(500, "Payment service is not configured")
    expected = hmac.new(secret.encode(), f"{razorpay_order_id}|{razorpay_payment_id}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, razorpay_signature):
        raise AppError(400, "Invalid payment signature")
    try:
        razorpay_order = razorpay_client.order.fetch(razorpay_order_id)
        payment = razorpay_client.payment.fetch(razorpay_payment_id)
    except Exception:
        raise AppError(400, "Unable to verify payment with payment provider")

    expected_amount = int(round(float(pending["totalAmount"]) * 100))
    if str(payment.get("order_id")) != str(razorpay_order_id) or payment.get("status") != "captured":
        raise AppError(400, "Payment could not be verified")
    if int(razorpay_order.get("amount", 0)) != expected_amount or int(payment.get("amount", 0)) != expected_amount:
        raise AppError(400, "Captured payment amount does not match order total")
    duplicate = await db.orders.find_one({"razorpayPaymentId": razorpay_payment_id, "_id": {"$ne": pending["_id"]}})
    if duplicate:
        raise AppError(409, "Payment has already been used for an order")

    result = await db.orders.update_one({"_id": pending["_id"], "paymentStatus": "Pending"}, {"$set": {"paymentStatus": "Paid", "razorpayPaymentId": razorpay_payment_id, "paymentAmountPaise": int(payment["amount"]), "orderStatus": "Processing", "updatedAt": datetime.datetime.utcnow()}})
    if result.modified_count != 1:
        raise AppError(409, "Payment was already processed")
    await db.carts.update_one({"user": current_user["_id"]}, {"$set": {"items": []}}, upsert=False)
    return {"success": True, "orderId": str(pending["_id"]), "paymentStatus": "Paid"}


async def create_order(current_user: dict, items: list, subtotal: float, discount: float, delivery_charge: float, total_amount: float, coupon_used: str | None, payment_method: str | None, address: Any, razorpay_order_id: str | None = None, razorpay_payment_id: str | None = None) -> dict:
    db = get_db()
    payment_method = (payment_method or "COD").upper()
    if payment_method == "ONLINE":
        raise AppError(400, "Online orders must be created through the payment flow")
    normalized, reserved, calculated_subtotal = await _build_and_reserve_items(db, items)
    discount = _money(discount, "discount")
    delivery = _money(delivery_charge, "delivery charge")
    total = round(calculated_subtotal - discount + delivery, 2)
    if abs(_money(total_amount, "total amount") - total) > 0.01:
        await _release_stock(db, [{"product": p, "quantity": q} for p, q in reserved])
        raise AppError(400, "Order total does not match product prices")
    now = datetime.datetime.utcnow()
    doc = {"user": current_user["_id"], "items": normalized, "subtotal": calculated_subtotal, "discount": discount, "deliveryCharge": delivery, "totalAmount": total, "couponUsed": coupon_used, "paymentMethod": "COD", "paymentStatus": "Pending", "address": _format_address(address), "orderStatus": "Processing", "trackingId": new_tracking_id(), "createdAt": now, "updatedAt": now}
    try:
        result = await db.orders.insert_one(doc)
        doc["_id"] = result.inserted_id
        await db.carts.update_one({"user": current_user["_id"]}, {"$set": {"items": []}}, upsert=False)
        return doc
    except Exception:
        await _release_stock(db, normalized)
        raise


async def _populate_order_items(order: dict) -> dict:
    db = get_db()
    for item in order.get("items", []):
        item["product"] = await db.products.find_one({"_id": item["product"]})
    return order


async def get_user_orders(current_user: dict) -> list:
    db = get_db()
    orders = [o async for o in db.orders.find({"user": current_user["_id"]}).sort("createdAt", -1)]
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
    result = await db.orders.update_one({"_id": oid, "orderStatus": {"$in": list(CANCELLABLE_STATUSES)}}, {"$set": {"orderStatus": "Cancelled", "updatedAt": datetime.datetime.utcnow()}})
    if result.modified_count != 1:
        raise AppError(409, "Order was already updated")
    await _release_stock(db, order.get("items", []))
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
    if order["orderStatus"] in {"Cancelled", "Delivered"} and status != order["orderStatus"]:
        raise AppError(400, f"{order['orderStatus']} order cannot move to another status")
    await db.orders.update_one({"_id": oid}, {"$set": {"orderStatus": status, "updatedAt": datetime.datetime.utcnow()}})
    return {"message": "Order status updated"}
