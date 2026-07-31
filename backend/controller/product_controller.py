"""
Product controller.
Equivalent of controller/productController.js
"""
import base64
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import UploadFile

import cloudinary.uploader
from config.db import get_db
from models.product import new_product_document
from utils.errors import AppError


async def _upload_image(file: UploadFile) -> str:
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    data_uri = f"data:{file.content_type};base64,{b64}"
    result = cloudinary.uploader.upload(data_uri, folder="ecommimages")
    return result["secure_url"]


async def create_product(
    name: str,
    price: float,
    category: str,
    description: str,
    stock: int,
    image: Optional[UploadFile],
) -> dict:
    db = get_db()

    image_url = None
    if image is not None:
        image_url = await _upload_image(image)

    doc = new_product_document(name, float(price), category, description, int(stock), image_url)
    result = await db.products.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def get_all_products() -> list:
    db = get_db()
    cursor = db.products.find().sort("createdAt", -1)
    return [p async for p in cursor]


async def get_product_by_id(product_id: str) -> dict:
    db = get_db()
    try:
        oid = ObjectId(product_id)
    except InvalidId:
        raise AppError(404, "Resource not found")

    product = await db.products.find_one({"_id": oid})
    if not product:
        raise AppError(404, "Product not found")
    return product


async def update_product(
    product_id: str,
    name: Optional[str],
    category: Optional[str],
    description: Optional[str],
    price: Optional[str],
    stock: Optional[str],
    image: Optional[UploadFile],
) -> dict:
    db = get_db()
    try:
        oid = ObjectId(product_id)
    except InvalidId:
        raise AppError(404, "Resource not found")

    product = await db.products.find_one({"_id": oid})
    if not product:
        raise AppError(404, "Product not found")

    update: dict = {}

    if image is not None:
        update["image"] = await _upload_image(image)
    else:
        update["image"] = product.get("image")

    if name is not None:
        update["name"] = name
    if category is not None:
        update["category"] = category
    if description is not None:
        update["description"] = description
    if price is not None and price != "":
        update["price"] = float(price)
    if stock is not None and stock != "":
        update["stock"] = int(stock)

    await db.products.update_one({"_id": oid}, {"$set": update})
    return await db.products.find_one({"_id": oid})


async def delete_product(product_id: str) -> dict:
    db = get_db()
    try:
        oid = ObjectId(product_id)
    except InvalidId:
        raise AppError(404, "Resource not found")

    product = await db.products.find_one({"_id": oid})
    if not product:
        raise AppError(404, "Product not found")

    await db.products.delete_one({"_id": oid})
    return {"message": "Product deleted successfully"}


async def save_recent_search(current_user: dict, query: str) -> list:
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})

    recent = [item for item in user.get("recentSearches", []) if item != query]
    recent.insert(0, query)
    recent = recent[:5]

    await db.users.update_one({"_id": user["_id"]}, {"$set": {"recentSearches": recent}})
    return recent
