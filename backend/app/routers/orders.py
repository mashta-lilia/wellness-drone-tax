from fastapi import APIRouter, Depends, status, Query, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from typing import Optional

from app.db.database import get_db
from app.db.models.models import Order
from app.schemas.order import OrderCreate, OrderResponse
from app.services.tax_service import get_tax_service, TaxCalculatorService
from app.services.order_service import OrderService

router = APIRouter(prefix="/api/orders", tags=["Orders"])

# Функція для ініціалізації сервісу (Dependency Injection)
def get_order_service(
    db: Session = Depends(get_db), 
    tax_svc: TaxCalculatorService = Depends(get_tax_service)
):
    return OrderService(db, tax_svc)

# --- 1. РУЧНЕ СТВОРЕННЯ ЗАМОВЛЕННЯ ---
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_order(
    order_data: OrderCreate, 
    service: OrderService = Depends(get_order_service)
):
    return await service.create_manual_order(order_data)

# --- 2. ІМПОРТ ЗАМОВЛЕНЬ З CSV (Pandas Level 2) ---
@router.post("/import")
async def import_csv_orders(
    file: UploadFile = File(...), 
    service: OrderService = Depends(get_order_service)
):
    return await service.process_csv_import(file)

# --- 3. СПИСОК ЗАМОВЛЕНЬ ІЗ СТАТИСТИКОЮ ---
@router.get("/")
def get_orders_list(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    sortBy: str = Query("timestamp"),
    sortOrder: str = Query("desc"),
    search: Optional[str] = Query(None, description="Пошук за ID"),
    date: Optional[str] = Query(None, description="Фільтр за датою YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    
    # Фільтрація
    if search:
        query = query.filter(Order.id.ilike(f"%{search}%"))
    if date:
        query = query.filter(cast(Order.timestamp, Date) == date)

    # Статистика по ВСІЙ відфільтрованій базі
    total_count = query.count()
    total_tax = query.with_entities(func.sum(Order.tax_amount)).scalar() or 0.0
    avg_rate = query.with_entities(func.avg(Order.composite_tax_rate)).scalar() or 0.0
    
    # Сортування та пагінація
    sort_column = getattr(Order, sortBy, Order.timestamp)
    if sortOrder == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    skip = (page - 1) * limit
    orders = query.offset(skip).limit(limit).all()
    
    return {
        "items": orders,
        "total": total_count,
        "total_tax": float(total_tax),
        "avg_rate": float(avg_rate),
        "page": page,
        "size": limit
    }

# --- 4. ОЧИЩЕННЯ БАЗИ ДАНИХ ---
@router.delete("/clear", status_code=status.HTTP_200_OK)
def clear_all_orders(db: Session = Depends(get_db)):
    try:
        db.query(Order).delete()
        db.commit()
        return {"detail": "Всі дані успішно видалено"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Помилка при видаленні даних з БД")