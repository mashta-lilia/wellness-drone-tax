from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import orders, taxes  

# --- Импорты для базы данных ---
from app.db.database import engine, Base
from app.db.models import models

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Wellness Drone Tax")

# Налаштування CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Разрешает всем (включая фронтенд) стучаться к API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router)
app.include_router(taxes.router)  # <--- 2. Подключили роутер налогов!

@app.get("/")
def read_root():
    return {"message": "Wellness Drone Tax API is running!"}