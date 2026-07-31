"""
Custom application error.
Equivalent in spirit to `res.status(x); throw new Error(msg)` used throughout
the Node controllers. Raise AppError(status_code, message) anywhere in a
controller and middleware/error_middleware.py will turn it into the same
JSON shape the Express errorHandler produced: {"message": ...}
"""


class AppError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(message)
