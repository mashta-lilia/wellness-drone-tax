import csv
import io
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, status, Query, File, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models.models import Order
from app.schemas.order import OrderCreate, OrderResponse
from app.services.tax_service import TaxCalculatorService, get_tax_service

router = APIRouter(prefix="/api/orders", tags=["Orders"])

# --- 1. РУЧНЕ СТВОРЕННЯ ЗАМОВЛЕННЯ ---
@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    tax_service: TaxCalculatorService = Depends(get_tax_service)
):
    tax_rate = await tax_service.get_tax_rate(order_in.latitude, order_in.longitude)
    tax_amount = round(order_in.subtotal * tax_rate, 2)
    total_amount = round(order_in.subtotal + tax_amount, 2)
    
    new_order = Order(
        id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc),
        latitude=order_in.latitude,
        longitude=order_in.longitude,
        subtotal=order_in.subtotal,
        composite_tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        breakdown={"info": "Manual entry"},
        jurisdictions=[]
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

# --- 2. СПИСОК ЗАМОВЛЕНЬ ІЗ СОРТУВАННЯМ ---
@router.get("/")
def read_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    sortBy: str = Query("timestamp"),
    sortOrder: str = Query("desc"),
    db: Session = Depends(get_db)
):
    skip = (page - 1) * limit
    query = db.query(Order)
    
    # Динамічне сортування
    sort_column = getattr(Order, sortBy, Order.timestamp)
    if sortOrder == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    total = query.count()
    orders = query.offset(skip).limit(limit).all()
    
    return {
        "items": orders,
        "total": total,
        "page": page,
        "size": limit
    }

# --- 3. ІМПОРТ ЗАМОВЛЕНЬ З CSV ---
@router.post("/import", include_in_schema=True)
async def import_orders(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    tax_service: TaxCalculatorService = Depends(get_tax_service)
):
    content = await file.read()
    decoded = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    count = 0
    for row in reader:
        try:
            # Читаємо дані (код розуміє і 'lat', і 'latitude')
            lat = float(row.get('latitude') or row.get('lat'))
            lon = float(row.get('longitude') or row.get('lon'))
            subtotal = float(row.get('subtotal'))

            tax_rate = await tax_service.get_tax_rate(lat, lon)
            tax_amount = round(subtotal * tax_rate, 2)
            total_amount = round(subtotal + tax_amount, 2)

            new_order = Order(
                id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                latitude=lat,
                longitude=lon,
                subtotal=subtotal,
                composite_tax_rate=tax_rate,
                tax_amount=tax_amount,
                total_amount=total_amount,
                breakdown={"info": "CSV Import"},
                jurisdictions=[]
            )
            db.add(new_order)
            count += 1
        except Exception as e:
            print(f"Skipping row due to error: {e}")

    db.commit()
    
    # ВОТ ЗДЕСЬ ГЛАВНОЕ ИЗМЕНЕНИЕ: возвращаем то, что ждет фронт
    return {"success_count": count}