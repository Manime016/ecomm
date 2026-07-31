"""
Cart routes.
Equivalent of routes/cartRoutes.js
"""
from fastapi import APIRouter, Depends

from controller import cart_controller
from middleware.auth_middleware import protect
from utils.serializers import serialize_doc

router = APIRouter()


@router.get("/")
async def get_cart(current_user: dict = Depends(protect)):
    result = await cart_controller.get_cart(current_user)
    return serialize_doc(result)


@router.post("/add")
async def add_to_cart(payload: dict, current_user: dict = Depends(protect)):
    result = await cart_controller.add_to_cart(current_user, payload.get("productId"))
    return serialize_doc(result)


@router.put("/update")
async def update_cart_quantity(payload: dict, current_user: dict = Depends(protect)):
    result = await cart_controller.update_cart_quantity(
        current_user, payload.get("productId"), payload.get("quantity")
    )
    return serialize_doc(result)


@router.delete("/remove")
async def remove_from_cart(payload: dict, current_user: dict = Depends(protect)):
    result = await cart_controller.remove_from_cart(current_user, payload.get("productId"))
    return serialize_doc(result)


@router.delete("/clear")
async def clear_cart(current_user: dict = Depends(protect)):
    result = await cart_controller.clear_cart(current_user)
    return serialize_doc(result)
