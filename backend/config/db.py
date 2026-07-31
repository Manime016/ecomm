"""
MongoDB connection setup using Motor (async driver).
Equivalent of config/db.js
"""
import os
import sys
import motor.motor_asyncio

client: motor.motor_asyncio.AsyncIOMotorClient | None = None
db: motor.motor_asyncio.AsyncIOMotorDatabase | None = None


async def connect_db():
    """Connect to MongoDB. Exits the process on failure, matching the Node behavior."""
    global client, db
    mongo_uri = os.getenv("MONGO_URI")
    try:
        client = motor.motor_asyncio.AsyncIOMotorClient(mongo_uri)
        # get_default_database() uses the db name embedded in the URI (e.g. .../ecomm)
        db = client.get_default_database()
        await client.admin.command("ping")
        print("MongoDB Connected \u2705")
    except Exception as error:
        print("DB Error \u274c", str(error))
        sys.exit(1)


async def close_db():
    global client
    if client:
        client.close()


def get_db() -> motor.motor_asyncio.AsyncIOMotorDatabase:
    if db is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return db


async def create_indexes():
    """Recreates the indexes declared inline on the original Mongoose schemas
    (userSchema.index, productSchema.index, orderSchema.index, plus the
    unique/required indexes implied by `unique: true` fields)."""
    database = get_db()
    await database.users.create_index("email", unique=True)
    await database.products.create_index([("name", "text"), ("category", "text")])
    await database.orders.create_index([("user", 1), ("createdAt", -1)])
    await database.carts.create_index("user", unique=True)
    await database.coupons.create_index("code", unique=True)

