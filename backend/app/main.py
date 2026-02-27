from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import orders
from app.core.config import settings

app = FastAPI(
    title="Instant Wellness Kits Tax API",
    description="API для розрахунку податків на доставку дронами у штаті Нью-Йорк",
    version="1.0.0"
)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router, prefix="/orders")

@app.get("/")
def read_root():
    """Health check ендпоінт для перевірки статусу сервера."""
    return {"status": "success", "message": "Wellness Drone Tax API is running!"}