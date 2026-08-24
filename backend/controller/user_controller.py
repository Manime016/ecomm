"""User profile controller."""
import secrets
import time

from config.db import get_db
from utils.errors import AppError
from utils.security import hash_password, verify_password


async def get_profile(current_user: dict) -> dict:
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]}, {"password": 0})
    if not user:
        raise AppError(404, "User not found")
    return user


async def send_otp(current_user: dict) -> dict:
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})

    if not user:
        raise AppError(404, "User not found")

    if user.get("otpAttempts", 0) >= 3:
        raise AppError(429, "Maximum OTP attempts reached")

    otp = f"{secrets.randbelow(1_000_000):06d}"

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "emailOtp": otp,
                "emailOtpExpire": int(time.time() * 1000) + 5 * 60 * 1000,
            },
            "$inc": {"otpAttempts": 1},
        },
    )

    # Development-only response. Production should deliver the OTP through
    # a trusted email/SMS provider and never expose it in the API response.
    return {"message": "OTP generated", "otp": otp}


async def update_profile(
    current_user: dict,
    name: str | None,
    email: str | None,
    otp: str | None,
    old_password: str | None,
    new_password: str | None,
) -> dict:
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})

    if not user:
        raise AppError(404, "User not found")

    update: dict = {}

    if name is not None:
        name = name.strip()
        if not name:
            raise AppError(400, "Name cannot be empty")
        update["name"] = name

    if email and email.lower().strip() != user["email"]:
        email = email.lower().strip()
        if not otp:
            raise AppError(400, "OTP required to change email")

        now_ms = int(time.time() * 1000)
        if (
            user.get("emailOtp") != otp
            or not user.get("emailOtpExpire")
            or user["emailOtpExpire"] < now_ms
        ):
            raise AppError(400, "Invalid or expired OTP")

        existing = await db.users.find_one({"email": email, "_id": {"$ne": user["_id"]}})
        if existing:
            raise AppError(409, "Email already in use")

        update["email"] = email
        update["emailOtp"] = None
        update["emailOtpExpire"] = None
        update["otpAttempts"] = 0

    if new_password is not None:
        if not old_password:
            raise AppError(400, "Current password required")
        if len(new_password) < 8:
            raise AppError(400, "New password must be at least 8 characters")
        if not verify_password(old_password, user["password"]):
            raise AppError(400, "Current password incorrect")
        update["password"] = hash_password(new_password)

    if update:
        await db.users.update_one({"_id": user["_id"]}, {"$set": update})

    updated = await db.users.find_one({"_id": user["_id"]}, {"password": 0})

    return {
        "message": "Profile updated successfully",
        "name": updated["name"],
        "email": updated["email"],
    }
