"""
Helpers to turn MongoDB documents (with ObjectId / datetime) into
JSON-serializable dicts, and to build the ObjectId annotated type used
across Pydantic models.
"""
from datetime import datetime
from typing import Any
from bson import ObjectId


def serialize_doc(doc: Any) -> Any:
    """Recursively convert ObjectId -> str and datetime -> isoformat,
    and rename Mongo's `_id` to `_id` (kept, but also mirrored as `id`)."""
    if doc is None:
        return None
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        out = {}
        for key, value in doc.items():
            out[key] = serialize_doc(value)
        if "_id" in out:
            out["_id"] = out["_id"]
            out.setdefault("id", out["_id"])
        return out
    return doc


def to_object_id(value: str, field_name: str = "id"):
    from utils.errors import AppError
    try:
        return ObjectId(value)
    except Exception:
        raise AppError(404, "Resource not found")
