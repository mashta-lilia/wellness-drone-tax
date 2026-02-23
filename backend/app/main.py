from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.services.import_service import ImportService
from app.routers import taxes

# Этот блок кода управляет жизненным циклом приложения
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Выполняется ДО того, как сервер начнет принимать запросы ---
    import_service = ImportService()
    
    # Проверяем, существует ли уже файл, чтобы не скачивать его при каждом мелком рестарте сервера
    if not import_service.file_path.exists():
        print("CSV датасет не найден. Начинаем загрузку...")
        await import_service.download_dataset()
    else:
        print("CSV датасет найден, загрузка при старте пропущена.")
        
    yield  # В этот момент сервер запускается и работает
    
    # --- Выполняется ПОСЛЕ остановки сервера (здесь можно закрывать соединения с БД) ---
    print("Сервер останавливается...")

# Подключаем lifespan к нашему приложению
app = FastAPI(lifespan=lifespan, title="Tax API")
app.include_router(taxes.router)