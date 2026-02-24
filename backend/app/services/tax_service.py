import csv
import httpx
from pathlib import Path
from functools import lru_cache
from fastapi import HTTPException

# Границы штата Нью-Йорк для валидации координат
NY_MIN_LAT, NY_MAX_LAT = 40.47, 45.02
NY_MIN_LON, NY_MAX_LON = -79.77, -71.78

class TaxCalculatorService:
    def __init__(self):
        # 1. Находим путь к файлу (app/services -> app -> utils)
        # Используем parent.parent, чтобы выйти из 'services' в 'app'
        base_dir = Path(__file__).resolve().parent.parent
        self.dataset_path = base_dir / "utils" / "nys_tax_rates.csv"
        
        # 2. Загружаем данные в словарь
        self.rates_cache = self._load_data()

    def _load_data(self) -> dict:
        rates = {}
        try:
            with open(self.dataset_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Ключ - название округа (маленькими буквами)
                    # "Albany County" -> "albany"
                    county_raw = row["County"].replace(" County", "").strip().lower()
                    rate = float(row["Rate"])
                    rates[county_raw] = rate
            print(f"✅ Загружено налоговых ставок: {len(rates)}")
        except FileNotFoundError:
            print(f"❌ ОШИБКА: Файл не найден по пути {self.dataset_path}")
        return rates

    async def calculate_tax(self, amount: float, lat: float, lon: float) -> dict:
        """
        Основной метод, который вызывает контроллер.
        Возвращает полную структуру с расчетами.
        """
        # 1. ПРОВЕРКА ГРАНИЦ (Валидация)
        if not (NY_MIN_LAT <= lat <= NY_MAX_LAT and NY_MIN_LON <= lon <= NY_MAX_LON):
            raise HTTPException(
                status_code=400, 
                detail=f"Coordinates ({lat}, {lon}) are outside of New York State."
            )

        # 2. Получаем ставку (через OSM или дефолт)
        county_name = await self._get_county_from_osm(lat, lon)
        
        # Ищем ставку (фолбэк на NYC 8.875%, если округ не найден в CSV)
        tax_rate = self.rates_cache.get(county_name.lower(), 0.08875)

        # 3. Математика
        tax_amount = round(amount * tax_rate, 2)
        total_amount = round(amount + tax_amount, 2)

        return {
            "tax_amount": tax_amount,
            "total_amount": total_amount,
            "rate": tax_rate,
            "county": county_name
        }
    
    async def _get_county_from_osm(self, lat: float, lon: float) -> str:
        """Запрашивает OpenStreetMap для получения названия округа"""
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "format": "json",
            "lat": lat,
            "lon": lon
        }
        headers = {"User-Agent": "WellnessDroneTax/1.0"} 
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, params=params, headers=headers, timeout=10.0)
                if resp.status_code != 200:
                    print(f"⚠️ OSM вернул статус {resp.status_code}")
                    return "New York"

                data = resp.json()
                address = data.get("address", {})
                
                # Приоритет: county -> city -> state_district
                county = address.get("county") or address.get("city") or "New York"
                
                # Убираем " County" для чистого поиска в CSV
                return county.replace(" County", "").strip()
            except Exception as e:
                print(f"⚠️ Ошибка запроса к OSM: {e}")
                return "New York" # Фолбэк

@lru_cache()
def get_tax_service() -> TaxCalculatorService:
    return TaxCalculatorService()