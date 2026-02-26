import uuid
import io
import time
import logging
import pandas as pd
from datetime import datetime, timezone
from sqlalchemy import insert
from fastapi import UploadFile, HTTPException
from app.db.models.models import Order

logger = logging.getLogger(__name__)

class OrderService:
    def __init__(self, db, tax_service):
        self.db = db
        self.tax_service = tax_service

    async def create_manual_order(self, order_data):
        # 1. Розраховуємо податки через швидкий локальний сервіс
        tax = await self.tax_service.calculate_full_tax_info(
            order_data.latitude, 
            order_data.longitude, 
            order_data.subtotal
        )

        # 2. Створюємо запис
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
        """РІВЕНЬ 3: Векторизований масовий імпорт із Pandas та сирим SQLite."""
        
        start_time = time.time()
        
        try:
            # 1. Читаємо файл прямо в Pandas DataFrame 
            content = await file.read()
            df = pd.read_csv(io.BytesIO(content))
            
            # --- НОВИЙ БЛОК: Розумний пошук колонок (підтримка української та англійської) ---
            col_map = {}
            for col in df.columns:
                col_lower = col.lower()
                if col_lower in ['latitude', 'lat', 'широта (lat)', 'широта']:
                    col_map[col] = 'latitude'
                elif col_lower in ['longitude', 'lon', 'довгота (lon)', 'довгота']:
                    col_map[col] = 'longitude'
                elif col_lower in ['subtotal', 'сума (subtotal)', 'сума']:
                    col_map[col] = 'subtotal'
            
            # Перейменовуємо знайдені колонки у стандартні
            df.rename(columns=col_map, inplace=True)
            
            # Перевіряємо, чи всі потрібні колонки знайшлися
            if not {'latitude', 'longitude', 'subtotal'}.issubset(df.columns):
                return {
                    "total_processed": 0, "success_count": 0, "error_count": 1,
                    "errors": [{"row": "-", "reason": f"У файлі відсутні необхідні колонки. Знайдено: {list(df.columns)}"}]
                }
            # ------------------------------------------
            
            # Очищаємо від битих даних (порожні рядки або текст замість чисел)
            df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
            df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
            df['subtotal'] = pd.to_numeric(df['subtotal'], errors='coerce')
            df = df.dropna(subset=['latitude', 'longitude', 'subtotal'])

            total_processed = len(df)
            
            # 2. ВЕКТОРНА ОБРОБКА ПОДАТКІВ (Повертає два масиви: успішні та з помилками)
            valid_df, invalid_df = self.tax_service.enrich_dataframe_with_taxes(df)
            
            # !!! ОСЬ ТОЙ САМИЙ РЯДОК, ЯКИЙ ВИРІШУЄ ПРОБЛЕМУ !!!
            invalid_count = len(invalid_df)

            success_count = 0
            if not valid_df.empty:
                # 3. Підготовка до масового запису
                valid_df['id'] = [str(uuid.uuid4()) for _ in range(len(valid_df))]
                current_time = datetime.now(timezone.utc).isoformat()
                valid_df['timestamp'] = current_time
                
                columns_to_insert = [
                    'id', 'timestamp', 'latitude', 'longitude', 'subtotal', 
                    'composite_tax_rate', 'tax_amount', 'total_amount', 
                    'breakdown', 'jurisdictions'
                ]
                
                # 4. АБСОЛЮТНИЙ БАЙПАС SQLALCHEMY (Прямий запис у базу)
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

            # --- Збираємо точні номери рядків з помилками ---
            errors_list = []
            if invalid_count > 0:
                # df.index пам'ятає номер рядка з CSV! Додаємо 2 (індекс з нуля + рядок заголовків)
                for idx in invalid_df.index:
                    errors_list.append({
                        "row": int(idx) + 2, 
                        "reason": "Координати знаходяться поза межами штату Нью-Йорк"
                    })
                    # Запобіжник: щоб браузер не завис, віддаємо максимум 50 перших помилок
                    if len(errors_list) >= 50:
                        errors_list.append({
                            "row": "...",
                            "reason": f"Та ще {invalid_count - 50} рядків з такою ж помилкою приховано..."
                        })
                        break

            elapsed_time = time.time() - start_time
            print(f"⚡ ФАЙЛ ОБРОБЛЕНО І ЗАПИСАНО У БД ЗА {elapsed_time:.3f} СЕКУНД! Рядків: {total_processed}", flush=True)

            return {
                "total_processed": total_processed,
                "success_count": success_count,
                "error_count": invalid_count,
                "errors": errors_list
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Критична помилка імпорту: {e}")
            # Тепер у разі помилки ми побачимо її реальний текст на фронтенді, а не просто "Помилка імпорту"
            raise HTTPException(status_code=500, detail=str(e))