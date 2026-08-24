"""Product routes."""
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile

from controller import product_controller
from middleware.auth_middleware import protect
from middleware.admin_middleware import admin_only
from utils.serializers import serialize_doc

router = APIRouter()

MAX_IMAGE_BYTES = 2 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


async def _check_image(file: Optional[UploadFile]) -> None:
    if file is None:
        return
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    contents = await file.read(MAX_IMAGE_BYTES + 1)
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 2MB)")
    await file.seek(0)


# ================= PUBLIC =================

@router.get("/")
async def get_all_products():
    result = await product_controller.get_all_products()
    return serialize_doc(result)


@router.get("/{product_id}")
async def get_product_by_id(product_id: str):
    result = await product_controller.get_product_by_id(product_id)
    return serialize_doc(result)


# ================= ADMIN =================

@router.post("/")
async def create_product(
    name: str = Form(...),
    price: float = Form(...),
    category: str = Form(...),
    description: str = Form(""),
    stock: int = Form(0),
    image: Optional[UploadFile] = None,
    current_user: dict = Depends(protect),
):
    admin_only(current_user)
    await _check_image(image)
    result = await product_controller.create_product(name, price, category, description, stock, image)
    return serialize_doc(result)


@router.put("/{product_id}")
async def update_product(
    product_id: str,
    name: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    price: Optional[str] = Form(None),
    stock: Optional[str] = Form(None),
    image: Optional[UploadFile] = None,
    current_user: dict = Depends(protect),
):
    admin_only(current_user)
    await _check_image(image)
    result = await product_controller.update_product(
        product_id, name, category, description, price, stock, image
    )
    return serialize_doc(result)


@router.delete("/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(protect)):
    admin_only(current_user)
    result = await product_controller.delete_product(product_id)
    return serialize_doc(result)


# ================= USER =================

@router.post("/recent-search")
async def save_recent_search(payload: dict, current_user: dict = Depends(protect)):
    result = await product_controller.save_recent_search(current_user, payload.get("query"))
    return serialize_doc(result)
