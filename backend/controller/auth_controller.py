"""Authentication controller."""
import secrets
import time

from config.db import get_db
from models.user import new_user_document
from utils.errors import AppError
from utils.security import hash_password, verify_password, create_token


async def register_user(name: str, email: str, password: str) -> dict:
    name = name.strip()
    email = email.lower().strip()

    if not name or not email or not password:
        raise AppError(400, "All fields required")
    if len(password) < 8:
        raise AppError(400, "Password must be at least 8 characters")

    db = get_db()
    exists = await db.users.find_one({"email": email})

    if exists:
        raise AppError(400, "User already exists")

    hashed = hash_password(password)
    doc = new_user_document(name, email, hashed)
    result = await db.users.insert_one(doc)

    return {"message": "Registered Successfully", "userId": str(result.inserted_id)}


async def login_user(email: str, password: str) -> dict:
    email = email.lower().strip()
    db = get_db()
    user = await db.users.find_one({"email": email})

    # Keep login failures intentionally generic so callers cannot distinguish
    # whether an email exists.
    if not user or not verify_password(password, user["password"]):
        raise AppError(401, "Invalid email or password")

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
    email = email.lower().strip()
    user = await db.users.find_one({"email": email})

    # Do not reveal whether an account exists.
    if not user:
        return {"message": "If the account exists, a reset request has been created"}

    token = secrets.token_urlsafe(32)

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"resetToken": token, "resetExpire": int(time.time() * 1000) + 15 * 60 * 1000}},
    )

    # This endpoint still returns the token because this project has no email
    # provider wired in yet. It must be replaced by email delivery before production.
    return {"message": "Reset token generated", "token": token}
