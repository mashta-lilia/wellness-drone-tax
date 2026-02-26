from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
import uuid

class TaxBreakdown(BaseModel):
    state_rate: float = 0.0
    county_rate: float = 0.0
    city_rate: float = 0.0
    special_rates: float = 0.0

class OrderBase(BaseModel):
    latitude: float
    longitude: float
    subtotal: float


from pydantic import BaseModel, Field

class OrderCreate(BaseModel):
    latitude: float = Field(
        ..., 
        ge=-90, le=90, 
        description="Широта має бути від -90 до 90"
    )
    longitude: float = Field(
        ..., 
        ge=-180, le=180, 
        description="Довгота має бути від -180 до 180"
    )
    subtotal: float = Field(
        ..., 
        gt=0, 
        description="Сума замовлення має бути більшою за нуль"
    )
class OrderResponse(OrderBase):
    id: uuid.UUID  
    timestamp: datetime
    composite_tax_rate: Optional[float]
    tax_amount: Optional[float]
    total_amount: Optional[float]
    breakdown: Optional[TaxBreakdown] 
    jurisdictions: Optional[List[str]] = []

    class Config:
        from_attributes = True

class PaginatedOrdersResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[OrderResponse]
