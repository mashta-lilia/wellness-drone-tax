import uuid
import io
import time
import logging
import pandas as pd
from datetime import datetime, timezone
from fastapi import UploadFile, HTTPException
from app.db.models.models import Order

logger = logging.getLogger(__name__)

class OrderService:
    def __init__(self, db, tax_service):
        self.db = db
        self.tax_service = tax_service

    async def create_manual_order(self, order_data):
        """Розрахунок податків і створення одиночного замовлення."""
        tax = await self.tax_service.calculate_full_tax_info(
            order_data.latitude, 
            order_data.longitude, 
            order_data.subtotal
        )

        new_order = Order(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            latitude=order_data.latitude,
            longitude=order_data.longitude,
            subtotal=order_data.subtotal,
            composite_tax_rate=tax["composite_tax_rate"],
            tax_amount=tax["tax_amount"],
            total_amount=tax["total_amount"],
            breakdown=tax["breakdown"],
            jurisdictions=tax["jurisdictions"]
        )

        self.db.add(new_order)
        self.db.commit()
        self.db.refresh(new_order)
        return new_order

    async def process_csv_import(self, file: UploadFile):
        """Векторизований масовий імпорт із Pandas та масовим записом у БД."""
        start_time = time.time()
        
        try:
            content = await file.read()
            df = pd.read_csv(io.BytesIO(content))
            
            # Розумний мапінг колонок (підтримка англійських та українських назв)
            col_map = {}
            for col in df.columns:
                col_lower = col.lower()
                if col_lower in ['latitude', 'lat', 'широта (lat)', 'широта']:
                    col_map[col] = 'latitude'
                elif col_lower in ['longitude', 'lon', 'довгота (lon)', 'довгота']:
                    col_map[col] = 'longitude'
                elif col_lower in ['subtotal', 'сума (subtotal)', 'сума', 'amount']:
                    col_map[col] = 'subtotal'
            
            df.rename(columns=col_map, inplace=True)
            
            if not {'latitude', 'longitude', 'subtotal'}.issubset(df.columns):
                return {
                    "total_processed": 0, "success_count": 0, "error_count": 1,
                    "errors": [{"row": "-", "reason": f"У файлі відсутні необхідні колонки. Знайдено: {list(df.columns)}"}]
                }
            
            # Валідація та очищення даних
            df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
            df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
            df['subtotal'] = pd.to_numeric(df['subtotal'], errors='coerce')
            df = df.dropna(subset=['latitude', 'longitude', 'subtotal'])

            total_processed = len(df)
            
            # Векторна обробка податків
            valid_df, invalid_df = self.tax_service.enrich_dataframe_with_taxes(df)
            invalid_count = len(invalid_df)
            success_count = 0

            if not valid_df.empty:
                valid_df['id'] = [str(uuid.uuid4()) for _ in range(len(valid_df))]
                valid_df['timestamp'] = datetime.now(timezone.utc).isoformat()
                
                columns_to_insert = [
                    'id', 'timestamp', 'latitude', 'longitude', 'subtotal', 
                    'composite_tax_rate', 'tax_amount', 'total_amount', 
                    'breakdown', 'jurisdictions'
                ]
                
                records_tuples = list(valid_df[columns_to_insert].itertuples(index=False, name=None))
                
                raw_conn = self.db.connection().connection
                cursor = raw_conn.cursor()
                
                sql = """
                INSERT INTO orders (id, timestamp, latitude, longitude, subtotal, composite_tax_rate, tax_amount, total_amount, breakdown, jurisdictions)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                cursor.executemany(sql, records_tuples)
                raw_conn.commit()
                
                success_count = len(records_tuples)

            # Формування списку помилок
            errors_list = []
            if invalid_count > 0:
                for idx in invalid_df.index:
                    errors_list.append({
                        "row": int(idx) + 2, 
                        "reason": "Координати знаходяться поза межами штату Нью-Йорк"
                    })
                    if len(errors_list) >= 50:
                        errors_list.append({
                            "row": "...",
                            "reason": f"Та ще {invalid_count - 50} рядків з такою ж помилкою приховано..."
                        })
                        break

            elapsed_time = time.time() - start_time
            logger.info(f"Файл оброблено за {elapsed_time:.3f} с. Успішно: {success_count}, Помилок: {invalid_count}")

            return {
                "total_processed": total_processed,
                "success_count": success_count,
                "error_count": invalid_count,
                "errors": errors_list
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Критична помилка імпорту CSV: {e}")
            raise HTTPException(status_code=500, detail=str(e))