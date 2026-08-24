"""Authentication dependency for protected routes."""
import jwt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Header

from config.db import get_db
from utils.errors import AppError
from utils.security import decode_token


async def protect(authorization: str | None = Header(default=None)) -> dict:
    if not authorization:
        raise AppError(401, "Not authorized, no token")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise AppError(401, "Not authorized, invalid authorization header")

    try:
        decoded = decode_token(token.strip())
    except jwt.ExpiredSignatureError:
        raise AppError(401, "Token expired")
    except (jwt.InvalidTokenError, TypeError):
        raise AppError(401, "Not authorized, invalid token")

    try:
        user_id = ObjectId(decoded["id"])
    except (InvalidId, KeyError, TypeError):
        raise AppError(401, "Not authorized, invalid token")

    db = get_db()
    user = await db.users.find_one({"_id": user_id}, {"password": 0})

    if not user:
        raise AppError(401, "User not found")

    return user
