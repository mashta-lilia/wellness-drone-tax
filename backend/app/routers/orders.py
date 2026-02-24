from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from app.db.database import get_db
from app.db.models.models import Order
from app.schemas.order import OrderCreate, OrderResponse
# Зверни увагу: тут більше немає OutsideNYSException
from app.services.tax_service import TaxCalculatorService, get_tax_service

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    tax_service: TaxCalculatorService = Depends(get_tax_service)
):
    # 1. Викликаємо сервіс (він тепер не кидає помилок, а повертає дефолтне значення, якщо щось не так)
    tax_rate = await tax_service.get_tax_rate(order_in.latitude, order_in.longitude)
        
    # 2. Рахуємо математику
    tax_amount = round(order_in.subtotal * tax_rate, 2)
    total_amount = round(order_in.subtotal + tax_amount, 2)

    # 3. Створюємо замовлення
    new_order = Order(
        id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc),

        latitude=order_in.latitude,
        longitude=order_in.longitude,
        subtotal=order_in.subtotal,
        
        composite_tax_rate=tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        
        # Заглушки для полів, які ми поки не рахуємо детально
        breakdown={"info": "Simple tax rate applied"}, 
        jurisdictions=[]
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return new_order