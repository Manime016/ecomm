"""FastAPI application entrypoint."""

import os

from dotenv import load_dotenv

load_dotenv()

from bson.errors import InvalidId
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import DuplicateKeyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from config.db import connect_db, close_db, create_indexes
from middleware.error_middleware import (
    app_error_handler,
    duplicate_key_handler,
    invalid_id_handler,
    validation_error_handler,
    not_found_handler,
    generic_error_handler,
)
from utils.errors import AppError

from routes.auth_routes import router as auth_router
from routes.product_routes import router as product_router
from routes.cart_routes import router as cart_router
from routes.order_routes import router as order_router
from routes.coupon_routes import router as coupon_router
from routes.user_routes import router as user_router

app = FastAPI(
    title="E-Commerce Backend API",
    version="1.0.0",
    description="REST API for authentication, products, carts, orders, coupons and payments.",
)


@app.on_event("startup")
async def on_startup():
    await connect_db()
    await create_indexes()


@app.on_event("shutdown")
async def on_shutdown():
    await close_db()


# Development-friendly CORS. Restrict this further to the deployed frontend
# origin before production deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(.*\.)?localhost(:\d+)?|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(DuplicateKeyError, duplicate_key_handler)
app.add_exception_handler(InvalidId, invalid_id_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(Exception, generic_error_handler)

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(product_router, prefix="/api/products", tags=["products"])
app.include_router(cart_router, prefix="/api/cart", tags=["cart"])
app.include_router(order_router, prefix="/api/orders", tags=["orders"])
app.include_router(coupon_router, prefix="/api/coupons", tags=["coupons"])
app.include_router(user_router, prefix="/api/users", tags=["users"])


@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "service": "e-commerce-backend"}


@app.get("/health", tags=["health"])
async def health():
    return {"status": "healthy"}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        return await not_found_handler(request, exc)
    return await generic_error_handler(request, exc)


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 5000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
