"""
Coupon controller.
Equivalent of controller/couponController.js
"""
import datetime

from config.db import get_db
from utils.errors import AppError


async def get_coupons() -> list:
    db = get_db()
    now = datetime.datetime.utcnow()

    # Mirrors the Node query (note: the original JS object literal has two
    # `$or` keys, so only the second one actually survives in real JS too —
    # we keep that same effective behavior here for parity).
    cursor = db.coupons.find(
        {
            "isActive": True,
            "$or": [
                {"validTill": {"$exists": False}},
                {"validTill": {"$gte": now}},
            ],
        }
    )
    return [c async for c in cursor]


async def apply_coupon(current_user: dict, coupon_code: str, subtotal: float) -> dict:
    if not coupon_code:
        raise AppError(400, "Coupon required")

    db = get_db()
    coupon = await db.coupons.find_one({"code": coupon_code.upper(), "isActive": True})

    if not coupon:
        raise AppError(400, "Invalid coupon")

    now = datetime.datetime.utcnow()

    if coupon.get("validFrom") and now < coupon["validFrom"]:
        raise AppError(400, "Coupon not started yet")

    if coupon.get("validTill") and now > coupon["validTill"]:
        raise AppError(400, "Coupon expired")

    if subtotal < coupon.get("minOrderAmount", 0):
        raise AppError(400, f"Minimum order \u20b9{coupon.get('minOrderAmount', 0)}")

    applicable_users = coupon.get("applicableUsers", [])
    if applicable_users and current_user["_id"] not in applicable_users:
        raise AppError(403, "Coupon not applicable for this user")

    usage = next(
        (u for u in coupon.get("usedBy", []) if str(u["user"]) == str(current_user["_id"])),
        None,
    )

    if usage and usage.get("count", 0) >= coupon.get("usageLimitPerUser", 1):
        raise AppError(400, "Coupon usage limit exceeded")

    if coupon["discountType"] == "PERCENTAGE":
        discount = (subtotal * coupon["discountValue"]) / 100
        if coupon.get("maxDiscount", 0) > 0:
            discount = min(discount, coupon["maxDiscount"])
    else:
        discount = coupon["discountValue"]

    return {"discount": discount}
