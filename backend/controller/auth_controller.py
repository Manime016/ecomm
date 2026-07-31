"""
Auth controller.
Equivalent of controller/authController.js
"""
import secrets
import time

from config.db import get_db
from models.user import new_user_document
from utils.errors import AppError
from utils.security import hash_password, verify_password, create_token


async def register_user(name: str, email: str, password: str) -> dict:
    if not name or not email or not password:
        raise AppError(400, "All fields required")

    db = get_db()
    exists = await db.users.find_one({"email": email.lower().strip()})

    if exists:
        raise AppError(400, "User already exists")

    hashed = hash_password(password)
    doc = new_user_document(name, email, hashed)
    result = await db.users.insert_one(doc)

    return {"message": "Registered Successfully", "userId": str(result.inserted_id)}


async def login_user(email: str, password: str) -> dict:
    db = get_db()
    user = await db.users.find_one({"email": email.lower().strip()})

    if not user:
        raise AppError(400, "User not found")

    if not verify_password(password, user["password"]):
        raise AppError(400, "Wrong password")

    token = create_token(str(user["_id"]))

    return {
        "message": "Login Success",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user"),
        },
    }


async def forgot_password(email: str) -> dict:
    db = get_db()
    user = await db.users.find_one({"email": email.lower().strip()})

    if not user:
        raise AppError(404, "User not found")

    token = secrets.token_hex(20)

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"resetToken": token, "resetExpire": int(time.time() * 1000) + 15 * 60 * 1000}},
    )

    return {"message": "Reset token generated", "token": token}
