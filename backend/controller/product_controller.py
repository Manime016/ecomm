"""Product controller."""
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import UploadFile

import cloudinary.uploader
from config.db import get_db
from models.product import new_product_document
from utils.errors import AppError


async def _upload_image(file: UploadFile) -> str:
    """Upload an already validated image to Cloudinary.

    The route validates size/type before this function is called. Passing the
    file object directly avoids an unnecessary base64 copy in application
    memory.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise AppError(400, "Only image files are allowed")

    result = cloudinary.uploader.upload(file.file, folder="ecommimages", resource_type="image")
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

    name = name.strip()
    category = category.strip()
    description = description.strip()

    if not name:
        raise AppError(400, "Product name is required")
    if not category:
        raise AppError(400, "Product category is required")
    if price < 0:
        raise AppError(400, "Price cannot be negative")
    if stock < 0:
        raise AppError(400, "Stock cannot be negative")

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

    if name is not None:
        name = name.strip()
        if not name:
            raise AppError(400, "Product name cannot be empty")
        update["name"] = name
    if category is not None:
        category = category.strip()
        if not category:
            raise AppError(400, "Product category cannot be empty")
        update["category"] = category
    if description is not None:
        update["description"] = description.strip()
    if price is not None and price != "":
        try:
            parsed_price = float(price)
        except ValueError:
            raise AppError(400, "Invalid price")
        if parsed_price < 0:
            raise AppError(400, "Price cannot be negative")
        update["price"] = parsed_price
    if stock is not None and stock != "":
        try:
            parsed_stock = int(stock)
        except ValueError:
            raise AppError(400, "Invalid stock")
        if parsed_stock < 0:
            raise AppError(400, "Stock cannot be negative")
        update["stock"] = parsed_stock

    if not update:
        raise AppError(400, "No product fields supplied for update")

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
    query = (query or "").strip()
    if not query:
        raise AppError(400, "Search query is required")

    user = await db.users.find_one({"_id": current_user["_id"]})
    if not user:
        raise AppError(404, "User not found")

    recent = [item for item in user.get("recentSearches", []) if item != query]
    recent.insert(0, query)
    recent = recent[:5]

    await db.users.update_one({"_id": user["_id"]}, {"$set": {"recentSearches": recent}})
    return recent
