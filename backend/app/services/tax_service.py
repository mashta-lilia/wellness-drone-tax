import csv
import httpx
import logging
from pathlib import Path
from functools import lru_cache
from fastapi import HTTPException
from decimal import Decimal, ROUND_HALF_UP
from app.core.config import settings

# Налаштування логера для відстеження роботи сервісу
logger = logging.getLogger(__name__)

# Список округів транспортної зони MCTD
MCTD_COUNTIES = {
    "new york", "bronx", "kings", "queens", "richmond", 
    "dutchess", "nassau", "orange", "putnam", "rockland", 
    "suffolk", "westchester"
}

class TaxCalculatorService:
    def __init__(self):
        # Використовуємо шлях до датасету з налаштувань або обчислюємо відносно проекту
        base_dir = Path(__file__).resolve().parent.parent
        self.dataset_path = base_dir / "utils" / "nys_tax_rates.csv"
        self.rates_cache = self._load_data()

    def _load_data(self) -> dict:
        """Завантаження ставок з CSV файлу при ініціалізації."""
        rates = {}
        try:
            with open(self.dataset_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    county_raw = row["County"].replace(" County", "").strip().lower()
                    rates[county_raw] = float(row["Rate"])
            logger.info(f"✅ Податкові ставки успішно завантажені: {len(rates)} записів")
        except FileNotFoundError:
            logger.error(f"❌ КРИТИЧНА ПОМИЛКА: Файл не знайдено за шляхом {self.dataset_path}")
        except Exception as e:
            logger.error(f"❌ Помилка при читанні CSV: {e}")
        return rates

    async def _get_location_data(self, lat: float, lon: float) -> dict:
        """Використовує Nominatim API для визначення штату та округу."""
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "format": "json",
            "lat": lat,
            "lon": lon,
            "zoom": 10,
            "addressdetails": 1
        }
        headers = {"User-Agent": "WellnessDroneTax/1.0"} 
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, params=params, headers=headers, timeout=10.0)
                if resp.status_code != 200:
                    logger.error(f"Nominatim повернув помилку: {resp.status_code}")
                    raise HTTPException(status_code=503, detail="Сервіс геокодування недоступний")
                
                data = resp.json()
                if "error" in data:
                    logger.warning(f"Nominatim не знайшов адресу для {lat}, {lon}")
                    raise HTTPException(status_code=400, detail="Неможливо визначити локацію за координатами")

                address = data.get("address", {})
                state = address.get("state")
                county = address.get("county", address.get("city", "New York"))
                county_clean = county.replace(" County", "").strip()
                city = address.get("city", address.get("town", address.get("village", "")))

                return {
                    "state": state,
                    "county": county_clean,
                    "city": city
                }

            except httpx.RequestError as exc:
                logger.error(f"Помилка мережі при запиті до Nominatim: {exc}")
                raise HTTPException(status_code=503, detail="Помилка мережі при перевірці локації")


    async def calculate_full_tax_info(self, lat: float, lon: float, subtotal: float) -> dict:
        """Основний метод розрахунку податку на основі гео-даних."""
        # 1. Отримуємо дані про локацію через зовнішній API
        location = await self._get_location_data(lat, lon)
        
        # 2. Перевірка приналежності до штату NY (беремо назву з налаштувань)
        if location.get("state") != "New York":
            logger.info(f"Відмова: точка ({lat}, {lon}) знаходиться в штаті {location.get('state')}")
            raise HTTPException(
                status_code=400, 
                detail="Доставка можлива лише в межах штату Нью-Йорк"
            )

        county_name_lower = location["county"].lower()

        # 3. Визначення базових ставок (використовуємо Decimal для точності)
        state_rate = Decimal(str(settings.NY_STATE_TAX_RATE))
        special_rates = Decimal(str(settings.MCTD_TAX_RATE)) if county_name_lower in MCTD_COUNTIES else Decimal('0.0')
        city_rate = Decimal('0.0')
        
        # Отримуємо загальну ставку з кешу CSV (дефолт 8.875% для NYC)
        total_csv_rate = Decimal(str(self.rates_cache.get(county_name_lower, 0.08875)))
        
        # Обчислюємо ставку округу як залишок
        county_rate = total_csv_rate - state_rate - special_rates
        if county_rate < 0: 
            county_rate = Decimal('0.0')

        # 4. Розрахунок підсумкових сум
        composite_tax_rate = state_rate + county_rate + city_rate + special_rates
        subtotal_dec = Decimal(str(subtotal))
        
        raw_tax_amount = subtotal_dec * composite_tax_rate
        tax_amount = raw_tax_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        total_amount = subtotal_dec + tax_amount

        # 5. Формування результату
        jurisdictions = ["New York State", f"{location['county']} County"]
        if special_rates > 0:
            jurisdictions.append("MCTD (Special)")

        logger.info(f"Розраховано податок для {location['county']}: {composite_tax_rate*100}%")

        return {
            "composite_tax_rate": float(composite_tax_rate),
            "tax_amount": float(tax_amount),
            "total_amount": float(total_amount),
            "breakdown": {
                "state_rate": float(state_rate),
                "county_rate": float(county_rate),
                "city_rate": float(city_rate),
                "special_rates": float(special_rates)
            },
            "jurisdictions": jurisdictions
        }

@lru_cache()
def get_tax_service() -> TaxCalculatorService:
    return TaxCalculatorService()