from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import orders

# --- Імпорти для бази даних ---
from app.db.database import engine, Base
from app.db.models import models  # <--- 🔥 Важливо: імпортуємо моделі, щоб код про них знав

# --- 🔥 МАГІЯ: Створюємо таблиці автоматично при старті ---
# Ця команда перевіряє, чи є таблиця 'orders', і якщо немає — створює її.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Wellness Drone Tax")

# Налаштування CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router)

@app.get("/")
def read_root():
    return {"message": "Wellness Drone Tax API is running!"}