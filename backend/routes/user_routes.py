"""
User routes.
Equivalent of routes/userRoutes.js
"""
from fastapi import APIRouter, Depends

from controller import user_controller
from middleware.auth_middleware import protect
from models.user import UpdateProfileSchema
from utils.serializers import serialize_doc

router = APIRouter()


@router.get("/profile")
async def profile(current_user: dict = Depends(protect)):
    result = await user_controller.get_profile(current_user)
    return serialize_doc(result)


@router.post("/send-otp")
async def send_otp(current_user: dict = Depends(protect)):
    result = await user_controller.send_otp(current_user)
    return serialize_doc(result)


@router.put("/update-profile")
async def update_profile(payload: UpdateProfileSchema, current_user: dict = Depends(protect)):
    result = await user_controller.update_profile(
        current_user,
        payload.name,
        payload.email,
        payload.otp,
        payload.oldPassword,
        payload.newPassword,
    )
    return serialize_doc(result)
