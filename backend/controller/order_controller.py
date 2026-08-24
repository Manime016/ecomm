"""
Order controller.

Handles order creation, payment verification and order lifecycle operations.
"""
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


async def create_razorpay_order(amount: float) -> dict:
    if not amount:
        raise AppError(400, "Amount required")

    options = {
        "amount": int(amount * 100),
        "currency": "INR",
        "receipt": f"receipt_{int(time.time() * 1000)}",
    }

    return razorpay_client.order.create(data=options)


async def verify_razorpay_payment(
    razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str
) -> dict:
    body = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected_signature = hmac.new(
        os.getenv("RAZORPAY_KEY_SECRET", "").encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, razorpay_signature):
        raise AppError(400, "Invalid payment signature")

    return {"success": True}


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
        return "\n".join(parts).strip()
    return address


async def _reserve_stock(db, product_oid: ObjectId, quantity: int, product_name: str) -> None:
    """Atomically reserve stock so concurrent orders cannot oversell it."""
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
) -> dict:
    db = get_db()

    if not current_user or not current_user.get("_id"):
        raise AppError(401, "User not authenticated")

    if not items:
        raise AppError(400, "Cart is empty")

    normalized_items = []
    reserved_stock = []

    try:
        for item in items:
            raw_product = item.get("product")
            product_id = raw_product.get("_id") if isinstance(raw_product, dict) else raw_product

            try:
                product_oid = ObjectId(product_id)
            except (InvalidId, TypeError):
                raise AppError(404, "Resource not found")

            product = await db.products.find_one({"_id": product_oid})
            if not product:
                raise AppError(404, "Product not found")

            quantity = item.get("quantity")
            if not isinstance(quantity, int) or isinstance(quantity, bool) or quantity <= 0:
                raise AppError(400, "Quantity must be a positive integer")

            await _reserve_stock(db, product_oid, quantity, product["name"])
            reserved_stock.append((product_oid, quantity))
            normalized_items.append({"product": product_oid, "quantity": quantity})

        import datetime
        now = datetime.datetime.utcnow()

        order_doc = {
            "user": current_user["_id"],
            "items": normalized_items,
            "subtotal": subtotal,
            "discount": discount or 0,
            "deliveryCharge": delivery_charge or 0,
            "totalAmount": total_amount,
            "couponUsed": coupon_used,
            "paymentMethod": payment_method,
            "address": _format_address(address),
            "orderStatus": "Processing",
            "trackingId": new_tracking_id(),
            "createdAt": now,
            "updatedAt": now,
        }

        result = await db.orders.insert_one(order_doc)
        order_doc["_id"] = result.inserted_id

        await db.carts.update_one(
            {"user": current_user["_id"]},
            {"$set": {"items": []}},
            upsert=False,
        )

        return order_doc

    except Exception:
        # If order creation fails after stock was reserved, restore every reservation.
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
        raise AppError(401, "Not authorized")

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
        raise AppError(401, "Not authorized")

    if order["orderStatus"] in ["Shipped", "Out for Delivery", "Delivered"]:
        raise AppError(400, "Order cannot be cancelled now")

    await db.orders.update_one(
        {"_id": oid},
        {"$set": {"orderStatus": "Cancelled"}},
    )
    return {"message": "Order cancelled successfully"}


async def update_order_status(order_id: str, status: str) -> dict:
    db = get_db()
    try:
        oid = ObjectId(order_id)
    except (InvalidId, TypeError):
        raise AppError(404, "Resource not found")

    order = await db.orders.find_one({"_id": oid})

    if not order:
        raise AppError(404, "Order not found")

    await db.orders.update_one(
        {"_id": oid},
        {"$set": {"orderStatus": status}},
    )
    return {"message": "Order status updated"}
