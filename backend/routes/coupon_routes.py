"""
Coupon routes.
Equivalent of routes/couponRoutes.js
"""
from fastapi import APIRouter, Depends

from controller import coupon_controller
from middleware.auth_middleware import protect
from utils.serializers import serialize_doc

router = APIRouter()


@router.get("/")
async def get_coupons(current_user: dict = Depends(protect)):
    result = await coupon_controller.get_coupons()
    return serialize_doc(result)


@router.post("/apply")
async def apply_coupon(payload: dict, current_user: dict = Depends(protect)):
    result = await coupon_controller.apply_coupon(
        current_user, payload.get("couponCode"), payload.get("subtotal")
    )
    return serialize_doc(result)
