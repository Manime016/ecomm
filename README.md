# E-Commerce Backend

A Python/FastAPI backend for an e-commerce application using **MongoDB**. The project focuses on authentication, product management, carts, orders, coupons, inventory handling and payment integration.

## Stack

- Python
- FastAPI
- MongoDB + Motor
- Pydantic
- JWT authentication
- bcrypt password hashing
- Razorpay
- Cloudinary
- Uvicorn
- pytest
- Docker

## Architecture

```text
backend/
├── config/       # Database and external-service configuration
├── controller/   # Business workflows
├── middleware/   # Authentication and error handling
├── models/       # MongoDB document models
├── routes/       # HTTP endpoints
├── utils/        # Security and shared errors
├── tests/        # Automated tests
└── server.py     # FastAPI application entrypoint
```

The API separates routing from business logic and database access. MongoDB indexes are created during startup for common and uniqueness-sensitive queries.

## Core API

| Area | Purpose |
|---|---|
| `/api/auth` | Registration and authentication |
| `/api/products` | Product management and search |
| `/api/cart` | Cart operations |
| `/api/orders` | Order lifecycle and payments |
| `/api/coupons` | Coupon management |
| `/api/users` | User account operations |
| `/health` | Service health check |

## Important Backend Workflow

Order creation conditionally reserves available stock. If a later step fails, reserved quantities are released. This prevents a failed order from permanently consuming inventory.

Payment confirmation validates the Razorpay signature before accepting the payment result. Repeated callbacks are handled so an already-completed payment is not processed as a second successful order transition.

## Configuration

From `backend/`, copy `.env.example` to `.env` and provide real values for your environment:

```bash
cp .env.example .env
```

Never commit `.env` or real API credentials.

## Run Locally

```bash
cd backend
python -m venv .venv
```

Windows:

```bash
.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn server:app --reload --port 5000
```

Interactive documentation:

```text
http://127.0.0.1:5000/docs
```

Health check:

```text
http://127.0.0.1:5000/health
```

## Testing

Run from `backend/`:

```bash
pytest
```

## Production Notes

The current CORS configuration is intentionally development-friendly for localhost and Vercel deployments. Before production, replace the broad origin pattern with an explicit allowlist for the deployed frontend. Use managed secrets, HTTPS, structured logging, monitoring and database backups.

## Project Status

Portfolio project focused on practical Python backend engineering, database integration, authentication, inventory consistency, payment workflows and error handling.
