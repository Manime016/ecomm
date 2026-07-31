"""
User controller.
Equivalent of controller/userController.js
"""
import random
import time

from bson import ObjectId

from config.db import get_db
from utils.errors import AppError
from utils.security import hash_password, verify_password


async def get_profile(current_user: dict) -> dict:
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]}, {"password": 0})
    return user


async def send_otp(current_user: dict) -> dict:
    db = get_db()
    user = await db.users.find_one({"_id": current_user["_id"]})

    if not user:
        raise AppError(404, "User not found")

    if user.get("otpAttempts", 0) >= 3:
        raise AppError(400, "Maximum OTP attempts reached")

    otp = str(random.randint(100000, 999999))

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

    # NOTE (same as the original Node code): the OTP is returned directly in
    # the response for testing purposes. Remove this before production and
    # send it via email/SMS instead.
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

    if name:
        update["name"] = name

    if email and email != user["email"]:
        if not otp:
            raise AppError(400, "OTP required to change email")

        now_ms = int(time.time() * 1000)
        if (
            user.get("emailOtp") != otp
            or not user.get("emailOtpExpire")
            or user["emailOtpExpire"] < now_ms
        ):
            raise AppError(400, "Invalid or expired OTP")

        update["email"] = email
        update["emailOtp"] = None
        update["emailOtpExpire"] = None
        update["otpAttempts"] = 0

    if old_password and new_password:
        if not verify_password(old_password, user["password"]):
            raise AppError(400, "Old password incorrect")
        update["password"] = hash_password(new_password)

    if update:
        await db.users.update_one({"_id": user["_id"]}, {"$set": update})

    updated = await db.users.find_one({"_id": user["_id"]})

    return {
        "message": "Profile updated successfully",
        "name": updated["name"],
        "email": updated["email"],
    }
