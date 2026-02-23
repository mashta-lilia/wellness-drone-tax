from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, List

class OrderBase(BaseModel):
    latitude: float
    longitude: float
    subtotal: float

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: int
    timestamp: datetime
    composite_tax_rate: Optional[float]
    tax_amount: Optional[float]
    total_amount: Optional[float]
    break_down: Optional[Dict]
    jurisdictions: Optional[List[str]]

    class Config:
        from_attributes = True