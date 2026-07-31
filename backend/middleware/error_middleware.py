"""
Error handling middleware.
Equivalent of middleware/errorMiddleware.js (notFound + errorHandler).
Registered on the FastAPI app in server.py via app.add_exception_handler(...).
"""
import os
import traceback

from bson.errors import InvalidId
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo.errors import DuplicateKeyError

from utils.errors import AppError


async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.message,
            "stack": None if os.getenv("NODE_ENV") == "production" else "".join(
                traceback.format_exception(type(exc), exc, exc.__traceback__)
            ),
        },
    )


async def duplicate_key_handler(request: Request, exc: DuplicateKeyError):
    # Mirrors: if (err.code === 11000) -> 400 "Duplicate field value entered"
    return JSONResponse(status_code=400, content={"message": "Duplicate field value entered", "stack": None})


async def invalid_id_handler(request: Request, exc: InvalidId):
    # Mirrors: if (err.name === "CastError") -> 404 "Resource not found"
    return JSONResponse(status_code=404, content={"message": "Resource not found", "stack": None})


async def validation_error_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"message": "All fields required", "errors": exc.errors()})


async def not_found_handler(request: Request, exc):
    return JSONResponse(status_code=404, content={"message": f"Not Found - {request.url.path}"})


async def generic_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "message": str(exc) or "Server Error",
            "stack": None if os.getenv("NODE_ENV") == "production" else "".join(
                traceback.format_exception(type(exc), exc, exc.__traceback__)
            ),
        },
    )
