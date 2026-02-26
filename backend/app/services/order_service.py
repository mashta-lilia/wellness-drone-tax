import csv
import io
import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from app.db.models.models import Order
from app.schemas.order import OrderCreate
from app.services.tax_service import TaxCalculatorService

# Налаштування логування (Пункт 3)
logger = logging.getLogger(__name__)

class OrderService:
    def __init__(self, db: Session, tax_service: TaxCalculatorService):
        self.db = db
        self.tax_service = tax_service

    async def create_manual_order(self, order_data: OrderCreate) -> Order:
        tax_info = await self.tax_service.calculate_full_tax_info(
            order_data.latitude, order_data.longitude, order_data.subtotal
        )
        
        new_order = Order(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            latitude=order_data.latitude,
            longitude=order_data.longitude,
            subtotal=order_data.subtotal,
            composite_tax_rate=tax_info["composite_tax_rate"],
            tax_amount=tax_info["tax_amount"],
            total_amount=tax_info["total_amount"],
            breakdown=tax_info["breakdown"],
            jurisdictions=tax_info["jurisdictions"]
        )
        
        self.db.add(new_order)
        self.db.commit()
        self.db.refresh(new_order)
        return new_order

    async def process_csv_import(self, file: UploadFile):
        """Масовий імпорт з використанням однієї транзакції (Пункт 6)."""
        content = await file.read()
        reader = csv.DictReader(io.StringIO(content.decode('utf-8')))
        
        results = {"total_processed": 0, "success_count": 0, "error_count": 0, "errors": []}
        
        try:
            for row_num, row in enumerate(reader, start=1):
                results["total_processed"] += 1
                try:
                    lat = float(row.get('latitude') or row.get('lat'))
                    lon = float(row.get('longitude') or row.get('lon'))
                    subtotal = float(row.get('subtotal'))

                    tax = await self.tax_service.calculate_full_tax_info(lat, lon, subtotal)
                    
                    new_order = Order(
                        id=str(uuid.uuid4()),
                        timestamp=datetime.now(timezone.utc),
                        latitude=lat, longitude=lon, subtotal=subtotal,
                        composite_tax_rate=tax["composite_tax_rate"],
                        tax_amount=tax["tax_amount"],
                        total_amount=tax["total_amount"],
                        breakdown=tax["breakdown"],
                        jurisdictions=tax["jurisdictions"]
                    )
                    self.db.add(new_order)
                    results["success_count"] += 1
                except Exception as e:
                    results["error_count"] += 1
                    results["errors"].append({"row": row_num, "reason": str(e)})

            # Один коміт на весь файл (Пункт 6)
            self.db.commit()
            logger.info(f"Імпорт завершено: успішно {results['success_count']} з {results['total_processed']}")
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Критична помилка імпорту: {e}")
            raise HTTPException(status_code=500, detail="Помилка бази даних при масовому імпорті")

        return results