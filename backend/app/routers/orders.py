import csv
import io
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import HTTPException
from fastapi import APIRouter, Depends, status, Query, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from app.db.database import get_db
from app.db.models.models import Order
from app.schemas.order import OrderCreate, OrderResponse
from app.services.tax_service import TaxCalculatorService, get_tax_service

router = APIRouter(prefix="/api/orders", tags=["Orders"])

# --- 1. РУЧНЕ СТВОРЕННЯ ЗАМОВЛЕННЯ ---
# app/routers/orders.py

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    tax_service: TaxCalculatorService = Depends(get_tax_service)
):
    # 1. Получаем полные данные по налогам (сработает 400 ошибка, если точка вне NY)
    tax_data = await tax_service.calculate_full_tax_info(
        lat=order_in.latitude, 
        lon=order_in.longitude, 
        subtotal=order_in.subtotal
    )
    
    # 2. Сохраняем все в базу
    new_order = Order(
        latitude=order_in.latitude,
        longitude=order_in.longitude,
        subtotal=order_in.subtotal,
        composite_tax_rate=tax_data["composite_tax_rate"],
        tax_amount=tax_data["tax_amount"],
        total_amount=tax_data["total_amount"],
        breakdown=tax_data["breakdown"],         # Четкая структура с 4 полями
        jurisdictions=tax_data["jurisdictions"]  # Массив названий
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

# --- 2. СПИСОК ЗАМОВЛЕНЬ ІЗ СОРТУВАННЯМ ТА АГРЕГАЦІЄЮ ---
@router.get("/")
def read_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    sortBy: str = Query("timestamp"),
    sortOrder: str = Query("desc"),
    search: str = Query(None, description="Пошук за ID"),
    date: str = Query(None, description="Фільтр за датою YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    
    # 1. Застосовуємо фільтри з фронтенду
    if search:
        query = query.filter(Order.id.ilike(f"%{search}%"))
    if date:
        query = query.filter(cast(Order.timestamp, Date) == date)

    # 2. Рахуємо статистику по ВСІЙ відфільтрованій базі
    total_count = query.count()
    total_tax = query.with_entities(func.sum(Order.tax_amount)).scalar() or 0.0
    avg_rate = query.with_entities(func.avg(Order.composite_tax_rate)).scalar() or 0.0
    
    # 3. Застосовуємо сортування та пагінацію для таблиці
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
    
    total_processed = 0
    success_count = 0
    error_count = 0
    errors = []
    
    # enumerate(..., start=1) помогает нам знать номер строки (с учетом заголовка)
    for row_number, row in enumerate(reader, start=1):
        total_processed += 1
        try:
            # Читаем данные
            lat = float(row.get('latitude') or row.get('lat'))
            lon = float(row.get('longitude') or row.get('lon'))
            subtotal = float(row.get('subtotal'))

            # ВЫЗЫВАЕМ НАШ НОВЫЙ МЕТОД, КОТОРЫЙ УМЕЕТ ПРОВЕРЯТЬ ШТАТ И ДЕЛАТЬ РАЗБИВКУ
            tax_data = await tax_service.calculate_full_tax_info(lat, lon, subtotal)

            new_order = Order(
                id=str(uuid.uuid4()),
                timestamp=datetime.now(timezone.utc),
                latitude=lat,
                longitude=lon,
                subtotal=subtotal,
                composite_tax_rate=tax_data["composite_tax_rate"],
                tax_amount=tax_data["tax_amount"],
                total_amount=tax_data["total_amount"],
                breakdown=tax_data["breakdown"],         # Сохраняем правильный JSON
                jurisdictions=tax_data["jurisdictions"]  # Сохраняем массив зон
            )
            db.add(new_order)
            success_count += 1

        except HTTPException as e:
            # Ловим ошибку гео-валидации ("Доставка можлива лише...")
            error_count += 1
            errors.append({"row": row_number, "reason": e.detail})
            
        except ValueError:
            # Ловим ошибку, если в CSV вместо чисел текст (например, lat="текст")
            error_count += 1
            errors.append({"row": row_number, "reason": "Невірний формат координат або суми (очікуються числа)"})
            
        except Exception as e:
            # Ловим любые другие непредвиденные ошибки
            error_count += 1
            errors.append({"row": row_number, "reason": "Внутрішня помилка обробки"})

    # Сохраняем все успешные заказы разом
    db.commit()
    
    # Возвращаем идеальную структуру, которую ждет ImportCSVResponse на фронте
    return {
        "total_processed": total_processed,
        "success_count": success_count,
        "error_count": error_count,
        "errors": errors
    }

# --- 4. ОЧИЩЕННЯ БАЗИ ДАНИХ ---
@router.delete("/clear", status_code=status.HTTP_200_OK)
def clear_all_orders(db: Session = Depends(get_db)):
    try:
        # Видаляємо всі записи з таблиці Order
        db.query(Order).delete()
        db.commit()
        return {"detail": "Всі дані успішно видалено"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Помилка при видаленні даних з БД")