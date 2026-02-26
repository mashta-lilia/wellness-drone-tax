from fastapi import APIRouter, Depends, Query, status, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import Optional

from app.db.database import get_db
from app.db.models.models import Order
from app.schemas.order import OrderCreate, OrderResponse, PaginatedOrdersResponse
from app.services.tax_service import get_tax_service, TaxCalculatorService
from app.services.order_service import OrderService

router = APIRouter(prefix="/api/orders", tags=["Orders"])

# Dependency Injection для сервісу (Пункт 1)
def get_order_service(
    db: Session = Depends(get_db), 
    tax_svc: TaxCalculatorService = Depends(get_tax_service)
):
    return OrderService(db, tax_svc)

# --- 1. РУЧНЕ СТВОРЕННЯ ЗАМОВЛЕННЯ ---
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_order(
    order_in: OrderCreate, 
    svc: OrderService = Depends(get_order_service)
):
    """Створює замовлення вручну, використовуючи бізнес-логіку сервісу."""
    return await svc.create_manual_order(order_in)

# --- 2. ІМПОРТ ЗАМОВЛЕНЬ З CSV ---
@router.post("/import")
async def import_csv_orders(
    file: UploadFile = File(...), 
    svc: OrderService = Depends(get_order_service)
):
    """Масовий імпорт із CSV файлу з обробкою помилок та транзакційністю (Пункт 6)."""
    return await svc.process_csv_import(file)

# --- 3. СПИСОК ЗАМОВЛЕНЬ ІЗ СТАТИСТИКОЮ (Пункт 5) ---
@router.get("/", response_model=PaginatedOrdersResponse)
def get_orders_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    sortBy: str = Query("timestamp"),
    sortOrder: str = Query("desc"),
    search: Optional[str] = Query(None, description="Пошук за ID"),
    date: Optional[str] = Query(None, description="Фільтр за датою YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Отримує список замовлень. 
    Використовує 'def', бо робота з БД синхронна. 
    Рахує статистику по всій відфільтрованій базі для дашборду.
    """
    query = db.query(Order)
    
    # Фільтрація
    if search:
        query = query.filter(Order.id.ilike(f"%{search}%"))
    if date:
        query = query.filter(cast(Order.timestamp, Date) == date)

    # Агрегація статистики по всій базі перед пагінацією
    total_count = query.count()
    total_tax = query.with_entities(func.sum(Order.tax_amount)).scalar() or 0.0
    avg_rate = query.with_entities(func.avg(Order.composite_tax_rate)).scalar() or 0.0

    # Сортування
    sort_column = getattr(Order, sortBy, Order.timestamp)
    if sortOrder == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Пагінація
    skip = (page - 1) * limit
    orders = query.offset(skip).limit(limit).all()
    
    return {
        "items": orders,
        "total": total_count,
        "total_tax": float(total_tax),
        "avg_rate": float(avg_rate),
        "page": page,
        "limit": limit
    }


@router.delete("/clear", status_code=status.HTTP_200_OK)
def clear_all_orders(db: Session = Depends(get_db)):
    """Повністю видаляє всі записи з бази даних."""
    try:
        db.query(Order).delete()
        db.commit()
        return {"detail": "Всі дані успішно видалено"}
    except Exception as e:
        db.rollback()
        # Тут можна додати logging.error(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Помилка при видаленні даних з БД")