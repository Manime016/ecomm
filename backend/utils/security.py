"""
Password hashing (bcrypt) and JWT helpers.
Equivalent of the bcryptjs / jsonwebtoken usage scattered across the
Node controllers and authMiddleware.js.
"""
import os
import datetime
import bcrypt
import jwt

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_EXPIRES_DAYS = 1  # matches expiresIn: "1d"


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt(10)).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "id": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=JWT_EXPIRES_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
