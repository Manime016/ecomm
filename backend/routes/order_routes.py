"""
Order routes.
Equivalent of routes/orderRoutes.js
"""
from fastapi import APIRouter, Depends

from controller import order_controller
from middleware.admin_middleware import require_admin
from middleware.auth_middleware import protect
from utils.serializers import serialize_doc

router = APIRouter()


# ===== RAZORPAY ROUTES =====

@router.post("/razorpay")
async def create_razorpay_order(payload: dict, current_user: dict = Depends(protect)):
    result = await order_controller.create_razorpay_order(payload.get("amount"))
    return serialize_doc(result)


@router.post("/verify")
async def verify_razorpay_payment(payload: dict, current_user: dict = Depends(protect)):
    result = await order_controller.verify_razorpay_payment(
        payload.get("razorpay_order_id"),
        payload.get("razorpay_payment_id"),
        payload.get("razorpay_signature"),
    )
    return serialize_doc(result)


# ===== USER ROUTES =====

@router.post("/")
async def create_order(payload: dict, current_user: dict = Depends(protect)):
    result = await order_controller.create_order(
        current_user,
        payload.get("items"),
        payload.get("subtotal"),
        payload.get("discount"),
        payload.get("deliveryCharge"),
        payload.get("totalAmount"),
        payload.get("couponUsed"),
        payload.get("paymentMethod"),
        payload.get("address"),
    )
    return serialize_doc(result)


@router.get("/")
async def get_user_orders(current_user: dict = Depends(protect)):
    result = await order_controller.get_user_orders(current_user)
    return serialize_doc(result)


@router.get("/{order_id}")
async def get_single_order(order_id: str, current_user: dict = Depends(protect)):
    result = await order_controller.get_single_order(current_user, order_id)
    return serialize_doc(result)


@router.put("/{order_id}/cancel")
async def cancel_order(order_id: str, current_user: dict = Depends(protect)):
    result = await order_controller.cancel_order(current_user, order_id)
    return serialize_doc(result)


# ===== ADMIN =====

@router.put("/{order_id}/status")
async def update_order_status(order_id: str, payload: dict, current_user: dict = Depends(require_admin)):
    result = await order_controller.update_order_status(order_id, payload.get("status"))
    return serialize_doc(result)
