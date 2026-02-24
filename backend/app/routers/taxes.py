from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.tax_service import TaxCalculatorService, get_tax_service
from app.services.import_service import ImportService

router = APIRouter(
    prefix="/api/taxes",
    tags=["Taxes"]
)

# --- 1. НОВЫЙ ЭНДПОИНТ (Импорт CSV) ---
@router.post("/import-csv")
async def import_orders_csv(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    tax_service: TaxCalculatorService = Depends(get_tax_service)
):
    """
    Загружает CSV файл с заказами, считает налоги и сохраняет в БД.
    Ожидает файл с колонками: amount, lat, lon
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
        
    # Инициализируем сервис импорта, передавая ему БД и сервис налогов
    import_service = ImportService(db, tax_service)
    
    # Запускаем процесс
    result = await import_service.process_csv(file)
    
    return result


# --- 2. СТАРЫЙ ЭНДПОИНТ (Расчет для одной точки) ---
# Мы его оставили, но переписали под новый метод calculate_tax
@router.get("/calculate")
async def calculate_tax(
    lat: float, 
    lon: float,
    amount: float = Query(100.0, description="Сумма для расчета налога (по дефолту 100)"),
    tax_service: TaxCalculatorService = Depends(get_tax_service) 
):
    """
    Получает расчет налога по координатам для конкретной суммы.
    Полезно для тестирования и отладки.
    """
    try:
        # Используем наш новый универсальный метод
        data = await tax_service.calculate_tax(amount, lat, lon)
        return {"status": "success", "data": data}
    except Exception as e:
        # Если координаты вне NY или ошибка OSM
        raise HTTPException(status_code=400, detail=str(e))