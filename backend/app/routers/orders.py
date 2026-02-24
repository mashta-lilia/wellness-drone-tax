from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from typing import Optional
from datetime import datetime, timezone
import uuid

import csv
import io
from fastapi.responses import StreamingResponse

from app.db.database import get_db
from app.db.models import Order 
from app.schemas.order import OrderCreate, OrderResponse, PaginatedOrdersResponse

router = APIRouter(prefix="/orders", tags=["Orders"])

# --- GET /orders (Ваша виконана задача) ---
@router.get("/", response_model=PaginatedOrdersResponse)
async def get_orders(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1, description="Номер сторінки"),
    limit: int = Query(20, ge=1, le=100, description="Кількість записів на сторінку"),
    sort_by: str = Query("timestamp", description="Поле для сортування"),
    order: str = Query("desc", pattern="^(asc|desc)$", description="Напрямок: asc або desc"),
    start_date: Optional[datetime] = Query(None, description="Початкова дата (YYYY-MM-DDTHH:MM:SS)"),
    end_date: Optional[datetime] = Query(None, description="Кінцева дата (YYYY-MM-DDTHH:MM:SS)")
):
    query = db.query(Order)

    if start_date:
        query = query.filter(Order.timestamp >= start_date)
    if end_date:
        query = query.filter(Order.timestamp <= end_date)

    total = query.count()

    if not hasattr(Order, sort_by):
        raise HTTPException(status_code=400, detail=f"Поле '{sort_by}' не підтримується")
    
    sort_column = getattr(Order, sort_by)
    if order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    calculated_offset = (page - 1) * limit
    orders = query.offset(calculated_offset).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": orders
    }

# --- ЗАГЛУШКА ДЛЯ BE2 ---
def calculate_taxes_mock(latitude: float, longitude: float, subtotal: float) -> dict:
    """
    Тимчасова заглушка для розрахунку податків.
    Задачею BE2 буде замінити цю функцію на реальний виклик TaxCalculatorService.
    """
    mock_composite_rate = 0.08875
    tax_amount = round(subtotal * mock_composite_rate, 2)
    
    return {
        "composite_tax_rate": mock_composite_rate,
        "tax_amount": tax_amount,
        "total_amount": subtotal + tax_amount,
        "breakdown": {
            "state_rate": 0.04000,
            "county_rate": 0.00000,
            "city_rate": 0.04500,
            "special_rates": 0.00375
        },
        "jurisdictions": [
            "NEW YORK STATE",
            "NEW YORK CITY",
            "METROPOLITAN COMMUTER TRANSPORTATION DISTRICT"
        ]
    }

# --- POST /orders (Ваша виконана задача) ---
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db)
):
    """
    Ручне створення замовлення.
    """
    # 1. FastAPI + Pydantic автоматично перевіряють наявність latitude, longitude 
    # та перевіряють, що subtotal >= 0 (інакше віддають 422).

    # 2. Отримуємо податки через тимчасову заглушку (для BE2)
    tax_data = calculate_taxes_mock(order_in.latitude, order_in.longitude, order_in.subtotal)

    # 3. Зберігаємо об'єкт замовлення в SQL-базу
    new_order = Order(
        id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc),
        latitude=order_in.latitude,
        longitude=order_in.longitude,
        subtotal=order_in.subtotal,
        composite_tax_rate=tax_data["composite_tax_rate"],
        tax_amount=tax_data["tax_amount"],
        total_amount=tax_data["total_amount"],
        breakdown=tax_data["breakdown"],
        jurisdictions=tax_data["jurisdictions"]
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # 4. Повертаємо збережений об'єкт (201 Created)
    return new_order

@router.get("/export", summary="Експорт замовлень у CSV")
async def export_orders(
    db: Session = Depends(get_db),
    sort_by: str = Query("timestamp", description="Поле для сортування"),
    order: str = Query("desc", pattern="^(asc|desc)$", description="Напрямок: asc або desc"),
    start_date: Optional[datetime] = Query(None, description="Початкова дата (YYYY-MM-DDTHH:MM:SS)"),
    end_date: Optional[datetime] = Query(None, description="Кінцева дата (YYYY-MM-DDTHH:MM:SS)")
):
    """
    Генерує та повертає CSV файл із замовленнями на основі переданих фільтрів.
    Ігнорує пагінацію, щоб вивантажити всі відповідні записи.
    """
    # 1. Формуємо базовий запит
    query = db.query(Order)

    # 2. Фільтрація за датами (така ж, як і в GET /orders)
    if start_date:
        query = query.filter(Order.timestamp >= start_date)
    if end_date:
        query = query.filter(Order.timestamp <= end_date)

    # 3. Сортування
    if hasattr(Order, sort_by):
        sort_column = getattr(Order, sort_by)
        if order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

    # 4. Отримуємо ВСІ записи, які пройшли фільтр (без .limit() та .offset())
    orders = query.all()

    # 5. Генеруємо CSV файл у пам'яті (без збереження на жорсткий диск)
    stream = io.StringIO()
    csv_writer = csv.writer(stream)

    # Записуємо заголовки колонок (за вашим завданням)
    csv_writer.writerow([
        "ID", "lat", "lon", "subtotal", 
        "composite_tax_rate", "tax_amount", "total_amount", "date"
    ])

    # Записуємо дані по кожному замовленню
    for order_obj in orders:
        # Форматуємо дату для зручного читання в Excel
        date_str = order_obj.timestamp.strftime("%Y-%m-%d %H:%M:%S") if order_obj.timestamp else ""
        
        csv_writer.writerow([
            order_obj.id,
            order_obj.latitude,
            order_obj.longitude,
            order_obj.subtotal,
            order_obj.composite_tax_rate,
            order_obj.tax_amount,
            order_obj.total_amount,
            date_str
        ])

    # Повертаємо курсор віртуального файлу на початок, щоб FastAPI міг його прочитати
    stream.seek(0)

    # 6. Повертаємо файл клієнту з правильними HTTP-заголовками
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = 'attachment; filename="orders_export.csv"'
    
    return response