"""
Auth routes.
Equivalent of routes/authRoutes.js
"""
from fastapi import APIRouter

from controller import auth_controller
from models.user import UserRegisterSchema, UserLoginSchema, ForgotPasswordSchema
from utils.serializers import serialize_doc

router = APIRouter()


@router.post("/register")
async def register(payload: UserRegisterSchema):
    result = await auth_controller.register_user(payload.name, payload.email, payload.password)
    return serialize_doc(result)


@router.post("/login")
async def login(payload: UserLoginSchema):
    result = await auth_controller.login_user(payload.email, payload.password)
    return serialize_doc(result)


@router.post("/forgot")
async def forgot(payload: ForgotPasswordSchema):
    result = await auth_controller.forgot_password(payload.email)
    return serialize_doc(result)
