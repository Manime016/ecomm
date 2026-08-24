# E-Commerce Backend

A Python backend for an e-commerce application built with **FastAPI** and **MongoDB**. The backend provides authentication, product management, carts, orders, coupons, user management and Razorpay payment integration.

## Tech Stack

- Python
- FastAPI
- MongoDB
- Motor / PyMongo
- Pydantic
- JWT authentication
- bcrypt password hashing
- Razorpay
- Cloudinary
- Uvicorn

## Architecture

```text
backend/
├── config/          # Database and external-service configuration
├── controller/      # Business logic
├── middleware/      # Authentication, admin and error handling
├── models/          # MongoDB document builders / models
├── routes/          # API route definitions
├── utils/           # Shared errors and security helpers
├── server.py        # FastAPI application entry point
├── requirements.txt
└── .env.example
```

## Main API Areas

| Area | Purpose |
|---|---|
| `/api/auth` | Registration, login and authentication |
| `/api/products` | Product CRUD and product search |
| `/api/cart` | Shopping cart operations |
| `/api/orders` | Order creation, retrieval and cancellation |
| `/api/coupons` | Coupon operations |
| `/api/users` | User profile and account operations |

The application also exposes interactive API documentation through FastAPI when the server is running.

## Backend Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based admin protection
- Request validation with Pydantic
- Centralized application error handling
- MongoDB indexes for frequently queried data
- Product image uploads through Cloudinary
- Razorpay order creation and payment-signature verification
- Atomic stock reservation during order creation
- Stock rollback if order creation fails after reservation
- Modular controller / route / middleware structure

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/Manime016/ecomm.git
cd ecomm/backend
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Copy `.env.example` to `.env` and provide the required MongoDB, JWT, Cloudinary and Razorpay configuration.

### 5. Start the API

```bash
uvicorn server:app --reload --port 5000
```

API documentation:

```text
http://127.0.0.1:5000/docs
```

## Engineering Notes

The order workflow reserves inventory with a conditional MongoDB update so concurrent requests cannot reserve more stock than is available. If a later step fails, previously reserved quantities are restored before the error is returned.

For production deployment, the allowed CORS origins should be explicitly configured for the deployed frontend rather than relying on broad development origins.

## Project Status

This is a portfolio project focused on demonstrating Python backend development, REST API design, database integration, authentication, payment integration and backend error handling.
