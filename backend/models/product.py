"""
Product model.
Equivalent of models/product.js
Mongo collection: "products"
Note: the original schema declares a text index on {name, category} and
timestamps; see server startup (create_indexes) for the Python equivalent.
"""
import datetime
from typing import Optional
from pydantic import BaseModel

COLLECTION = "products"


def new_product_document(
    name: str,
    price: float,
    category: str,
    description: str,
    stock: int,
    image: Optional[str],
) -> dict:
    now = datetime.datetime.utcnow()
    return {
        "name": name,
        "price": price,
        "category": category,
        "description": description or "",
        "stock": stock,
        "image": image,
        "createdAt": now,
        "updatedAt": now,
    }
