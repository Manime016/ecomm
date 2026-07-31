"""
Cart controller.
Equivalent of controller/cartController.js
"""
from bson import ObjectId
from bson.errors import InvalidId

from config.db import get_db
from utils.errors import AppError


async def _populate_cart(cart: dict) -> dict:
    """Mirrors mongoose's .populate('items.product')."""
    if not cart:
        return cart
    db = get_db()
    for item in cart.get("items", []):
        product = await db.products.find_one({"_id": item["product"]})
        item["product"] = product
    return cart


async def get_cart(current_user: dict) -> dict:
    db = get_db()
    cart = await db.carts.find_one({"user": current_user["_id"]})
    if not cart:
        return {"items": []}
    return await _populate_cart(cart)


async def add_to_cart(current_user: dict, product_id: str) -> dict:
    db = get_db()
    try:
        product_oid = ObjectId(product_id)
    except InvalidId:
        raise AppError(404, "Resource not found")

    product = await db.products.find_one({"_id": product_oid})
    if not product:
        raise AppError(404, "Product not found")

    cart = await db.carts.find_one({"user": current_user["_id"]})
    if not cart:
        result = await db.carts.insert_one({"user": current_user["_id"], "items": []})
        cart = {"_id": result.inserted_id, "user": current_user["_id"], "items": []}

    items = cart.get("items", [])
    existing = next((i for i in items if str(i["product"]) == product_id), None)

    if existing:
        if existing["quantity"] >= product["stock"]:
            raise AppError(400, "Stock limit reached")
        existing["quantity"] += 1
    else:
        items.append({"product": product_oid, "quantity": 1})

    await db.carts.update_one({"_id": cart["_id"]}, {"$set": {"items": items}})
    updated = await db.carts.find_one({"_id": cart["_id"]})
    return await _populate_cart(updated)


async def update_cart_quantity(current_user: dict, product_id: str, quantity: int) -> dict:
    if quantity < 1:
        raise AppError(400, "Invalid quantity")

    db = get_db()
    try:
        product_oid = ObjectId(product_id)
    except InvalidId:
        raise AppError(404, "Resource not found")

    cart = await db.carts.find_one({"user": current_user["_id"]})
    product = await db.products.find_one({"_id": product_oid})

    if not cart or not product:
        raise AppError(404, "Cart or product not found")

    if quantity > product["stock"]:
        raise AppError(400, "Stock limit exceeded")

    items = cart.get("items", [])
    item = next((i for i in items if str(i["product"]) == product_id), None)

    if not item:
        raise AppError(404, "Item not in cart")

    item["quantity"] = quantity

    await db.carts.update_one({"_id": cart["_id"]}, {"$set": {"items": items}})
    updated = await db.carts.find_one({"_id": cart["_id"]})
    return await _populate_cart(updated)


async def remove_from_cart(current_user: dict, product_id: str) -> dict:
    db = get_db()
    cart = await db.carts.find_one({"user": current_user["_id"]})

    if not cart:
        raise AppError(404, "Cart not found")

    items = [i for i in cart.get("items", []) if str(i["product"]) != product_id]

    await db.carts.update_one({"_id": cart["_id"]}, {"$set": {"items": items}})
    updated = await db.carts.find_one({"_id": cart["_id"]})
    return await _populate_cart(updated)


async def clear_cart(current_user: dict) -> dict:
    db = get_db()
    cart = await db.carts.find_one({"user": current_user["_id"]})

    if not cart:
        raise AppError(404, "Cart not found")

    await db.carts.update_one({"_id": cart["_id"]}, {"$set": {"items": []}})
    return {"message": "Cart cleared successfully"}
