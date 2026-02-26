from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import orders, taxes  
from app.core.config import settings # Використовуємо наш конфіг

app = FastAPI(title="Wellness Drone Tax")

# Налаштування CORS: обмежуємо доступ тільки твоїм фронтендом
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

# Підключаємо роутери
app.include_router(orders.router)
app.include_router(taxes.router)

@app.get("/")
def read_root():
    return {"message": "Wellness Drone Tax API is running!"}