from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.db.models import Order 
from app.schemas.order import PaginatedOrdersResponse

router = APIRouter(prefix="/orders", tags=["Orders"])

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

    # 1. Фільтрація
    if start_date:
        query = query.filter(Order.timestamp >= start_date)
    if end_date:
        query = query.filter(Order.timestamp <= end_date)

    # 2. Підрахунок загальної кількості (total)
    total = query.count()

    # 3. Сортування
    if not hasattr(Order, sort_by):
        raise HTTPException(status_code=400, detail=f"Поле '{sort_by}' не підтримується")
    
    sort_column = getattr(Order, sort_by)
    if order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    # 4. Пагінація
    calculated_offset = (page - 1) * limit
    orders = query.offset(calculated_offset).limit(limit).all()

    # 5. Відповідь точно за контрактом
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": orders
    }