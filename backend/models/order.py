"""
Order model.
Equivalent of models/order.js
Mongo collection: "orders"
"""
import time

COLLECTION = "orders"

ORDER_STATUSES = [
    "Processing",
    "Confirmed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
]


def new_tracking_id() -> str:
    return f"TRK{int(time.time() * 1000)}"
