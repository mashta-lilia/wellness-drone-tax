import csv
import codecs
import asyncio
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.services.tax_service import TaxCalculatorService
from app.db.models.models import Order 

class ImportService:
    def __init__(self, db: Session, tax_service: TaxCalculatorService):
        self.db = db
        self.tax_service = tax_service

    async def process_csv(self, file: UploadFile):
        results = {"success": 0, "failed": 0, "errors": []}
        
        # Читаем CSV (декодируем байты в строку)
        csv_reader = csv.DictReader(codecs.iterdecode(file.file, 'utf-8'))
        
        for row_idx, row in enumerate(csv_reader, start=1):
            try:
                # 1. Парсим данные из CSV (там поля могут называться amount/lat/lon)
                amount_val = float(row.get("amount", 0))
                lat_val = float(row.get("lat", 0))
                lon_val = float(row.get("lon", 0))

                # 2. Считаем налог
                calc_result = await self.tax_service.calculate_tax(amount_val, lat_val, lon_val)

                # 3. Сохраняем в БД, используя ИМЕНА ПОЛЕЙ ИЗ ТВОЕЙ МОДЕЛИ
                new_order = Order(
                    subtotal=amount_val,                # В модели это subtotal
                    latitude=lat_val,                   # В модели это latitude
                    longitude=lon_val,                  # В модели это longitude
                    composite_tax_rate=calc_result["rate"], # В модели это composite_tax_rate
                    
                    tax_amount=calc_result["tax_amount"],
                    total_amount=calc_result["total_amount"],
                    
                    # Сохраняем название округа в JSON поле breakdown
                    breakdown={
                        "county": calc_result["county"],
                        "state": "NY"
                    }
                )
                
                self.db.add(new_order)
                self.db.commit()
                
                results["success"] += 1
                
                # Пауза, чтобы не забанили API карт
                await asyncio.sleep(1.1) 

            except Exception as e:
                self.db.rollback()
                results["failed"] += 1
                results["errors"].append(f"Row {row_idx} error: {str(e)}")

        return results