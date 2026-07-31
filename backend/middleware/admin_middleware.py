"""
Admin middleware ("isAdmin").
Equivalent of middleware/adminMiddleware.js.
Use together with `protect`: Depends(protect) then Depends(require_admin).
"""
from fastapi import Depends

from middleware.auth_middleware import protect
from utils.errors import AppError


async def require_admin(user: dict = Depends(protect)) -> dict:
    if user and user.get("role") == "admin":
        return user
    raise AppError(403, "Admin access only")
