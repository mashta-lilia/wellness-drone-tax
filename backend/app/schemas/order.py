from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict
import uuid

class OrderBase(BaseModel):
    """Базова схема замовлення з географічною та фінансовою валідацією."""
    latitude: float = Field(..., ge=-90, le=90, description="Широта (від -90 до 90)")
    longitude: float = Field(..., ge=-180, le=180, description="Довгота (від -180 до 180)")
    subtotal: float = Field(..., gt=0, description="Сума замовлення (має бути > 0)")

class OrderCreate(OrderBase):
    pass

class TaxBreakdown(BaseModel):
    """Деталізація розрахунку складових податку."""
    state_rate: float = 0.0
    county_rate: float = 0.0
    city_rate: float = 0.0
    special_rates: float = 0.0

class OrderResponse(OrderBase):
    """Схема відповіді API з розрахованими податками для замовлення."""
    id: str
    timestamp: datetime
    composite_tax_rate: float
    tax_amount: float
    total_amount: float
    breakdown: Optional[TaxBreakdown]
    jurisdictions: List[str] = []

    class Config:
        from_attributes = True

class PaginatedOrdersResponse(BaseModel):
    """Схема пагінованої відповіді з агрегованою статистикою для дашборду."""
    total: int
    total_tax: float
    avg_rate: float
    page: int
    limit: int
    items: List[OrderResponse]