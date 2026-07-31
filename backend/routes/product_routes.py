"""
Product routes.
Equivalent of routes/productRoutes.js

Multer's `upload.single("image")` -> FastAPI's `UploadFile` form field.
2MB size limit is enforced manually since FastAPI/Starlette don't cap
upload size out of the box.

NOTE: the original Node route for `/recent-search` never applied the
`protect` middleware even though the controller reads `req.user` — that
would crash on every call. This conversion fixes that by requiring auth
on this route (same as the equivalent user-facing routes).
"""
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile

from controller import product_controller
from middleware.auth_middleware import protect
from utils.serializers import serialize_doc

router = APIRouter()

MAX_IMAGE_BYTES = 2 * 1024 * 1024  # 2MB, mirrors multer's limits.fileSize


async def _check_size(file: Optional[UploadFile]):
    if file is None:
        return
    contents = await file.read()
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
):
    await _check_size(image)
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
):
    await _check_size(image)
    result = await product_controller.update_product(
        product_id, name, category, description, price, stock, image
    )
    return serialize_doc(result)


@router.delete("/{product_id}")
async def delete_product(product_id: str):
    result = await product_controller.delete_product(product_id)
    return serialize_doc(result)


# ================= USER =================

@router.post("/recent-search")
async def save_recent_search(payload: dict, current_user: dict = Depends(protect)):
    result = await product_controller.save_recent_search(current_user, payload.get("query"))
    return serialize_doc(result)
