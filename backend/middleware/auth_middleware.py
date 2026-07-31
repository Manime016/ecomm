"""
Auth middleware ("protect").
Equivalent of middleware/authMiddleware.js — a FastAPI dependency that
reads the Bearer token, verifies the JWT, loads the user (minus password)
and returns it. Raise the same 401s the Node version throws.
"""
import jwt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Header

from config.db import get_db
from utils.errors import AppError
from utils.security import decode_token


async def protect(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer"):
        raise AppError(401, "Not authorized, no token")

    token = authorization.split(" ")[1]

    try:
        decoded = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise AppError(401, "Token expired")
    except jwt.InvalidTokenError:
        raise AppError(401, "Not authorized, invalid token")

    try:
        user_id = ObjectId(decoded["id"])
    except (InvalidId, KeyError):
        raise AppError(401, "Not authorized, invalid token")

    db = get_db()
    user = await db.users.find_one({"_id": user_id}, {"password": 0})

    if not user:
        raise AppError(401, "User not found")

    return user
