import uuid
from sqlalchemy import Column, Float, DateTime, JSON, String
from sqlalchemy.sql import func
from ..database import Base 

class Order(Base):
    """
    SQLAlchemy модель для таблиці замовлень.
    Зберігає координати, фінансові показники та деталізацію податків (у форматі JSON).
    """
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    
    composite_tax_rate = Column(Float, nullable=True)
    tax_amount = Column(Float, nullable=True)
    total_amount = Column(Float, nullable=True)
    
    breakdown = Column(JSON, nullable=True) 
    jurisdictions = Column(JSON, nullable=True)