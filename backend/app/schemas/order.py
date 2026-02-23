from pydantic import BaseModel
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

class OrderCreate(OrderBase):
    pass

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