"""
User model.
Equivalent of models/user.js (Mongoose schema).
Mongo collection: "users"
"""
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

COLLECTION = "users"


class UserRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLoginSchema(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordSchema(BaseModel):
    email: EmailStr


class UpdateProfileSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    otp: Optional[str] = None
    oldPassword: Optional[str] = None
    newPassword: Optional[str] = None


def new_user_document(name: str, email: str, hashed_password: str) -> dict:
    """Shape mirrors the Mongoose schema defaults (role, otpAttempts, recentSearches, timestamps)."""
    import datetime
    now = datetime.datetime.utcnow()
    return {
        "name": name,
        "email": email.lower().strip(),
        "password": hashed_password,
        "role": "user",
        "resetToken": None,
        "resetExpire": None,
        "emailOtp": None,
        "emailOtpExpire": None,
        "otpAttempts": 0,
        "recentSearches": [],
        "createdAt": now,
        "updatedAt": now,
    }
