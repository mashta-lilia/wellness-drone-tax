import csv
import httpx
from pathlib import Path
from functools import lru_cache
from fastapi import HTTPException
from decimal import Decimal, ROUND_HALF_UP

# Список округов, входящих в транспортную зону MCTD (Metropolitan Commuter Transportation District)
# В них применяется дополнительный специальный налог 0.375%
MCTD_COUNTIES = {
    "new york", "bronx", "kings", "queens", "richmond", 
    "dutchess", "nassau", "orange", "putnam", "rockland", 
    "suffolk", "westchester"
}

class TaxCalculatorService:
    def __init__(self):
        base_dir = Path(__file__).resolve().parent.parent
        self.dataset_path = base_dir / "utils" / "nys_tax_rates.csv"
        self.rates_cache = self._load_data()

    def _load_data(self) -> dict:
        rates = {}
        try:
            with open(self.dataset_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    county_raw = row["County"].replace(" County", "").strip().lower()
                    rates[county_raw] = float(row["Rate"])
            print(f"✅ Загружено налоговых ставок: {len(rates)}")
        except FileNotFoundError:
            print(f"❌ ОШИБКА: Файл не найден по пути {self.dataset_path}")
        return rates

    async def _get_location_data(self, lat: float, lon: float) -> dict:
        """
        Использует API Nominatim для точного определения локации.
        Возвращает штат, округ и город.
        """
        url = "https://nominatim.openstreetmap.org/reverse"
        params = {
            "format": "json",
            "lat": lat,
            "lon": lon,
            "zoom": 10, # Уровень детализации до города/округа
            "addressdetails": 1
        }
        headers = {"User-Agent": "WellnessDroneTax/1.0"} 
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, params=params, headers=headers, timeout=10.0)
                if resp.status_code != 200:
                    raise HTTPException(status_code=503, detail="Сервіс геокодування недоступний")
                
                data = resp.json()
                if "error" in data:
                    raise HTTPException(status_code=400, detail="Неможливо визначити локацію за координатами (можливо, точка в океані)")

                address = data.get("address", {})
                
                # Извлекаем нужные данные
                state = address.get("state")
                county = address.get("county", address.get("city", "New York"))
                county_clean = county.replace(" County", "").strip()
                city = address.get("city", address.get("town", address.get("village", "")))

                return {
                    "state": state,
                    "county": county_clean,
                    "city": city,
                    "raw_address": address
                }

            except httpx.RequestError:
                raise HTTPException(status_code=503, detail="Помилка мережі")


    async def calculate_full_tax_info(self, lat: float, lon: float, subtotal: float) -> dict:
        """
        Главный метод. Строго реализует алгоритм расчета из бизнес-требований.
        """
        # 1. Точная гео-валидация через внешний сервис
        location = await self._get_location_data(lat, lon)
        
        if location.get("state") != "New York":
            raise HTTPException(
                status_code=400, 
                detail="Доставка можлива лише в межах штату Нью-Йорк"
            )

        county_name_lower = location["county"].lower()

        # 2. Определение базовых ставок (Breakdown конструктор)
        state_rate = Decimal('0.04') # Базовый налог штата NY всегда 4%
        
        # Специальный налог (MCTD)
        special_rates = Decimal('0.00375') if county_name_lower in MCTD_COUNTIES else Decimal('0.0')
        
        city_rate = Decimal('0.0') # В NY большинство городов не имеют своего налога, налог идет на уровне округа
        
        # Получаем общую ставку из CSV (если нет в базе, по умолчанию берем NYC 8.875%)
        total_csv_rate = Decimal(str(self.rates_cache.get(county_name_lower, 0.08875)))
        
        # Высчитываем налог округа (Округ = Общий - Штат - Спец)
        # Если в твоем CSV лежат уже разбитые ставки, этот блок нужно будет адаптировать
        county_rate = total_csv_rate - state_rate - special_rates
        if county_rate < 0: 
            county_rate = Decimal('0.0')

        # 3. Расчет композитной ставки
        # composite_tax_rate = state_rate + county_rate + city_rate + special_rates
        composite_tax_rate = state_rate + county_rate + city_rate + special_rates

        # 4. Расчет суммы налога (с округлением до 2 знаков / центов)
        subtotal_dec = Decimal(str(subtotal))
        
        # tax_amount = subtotal * composite_tax_rate
        raw_tax_amount = subtotal_dec * composite_tax_rate
        tax_amount = raw_tax_amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        # 5. Итоговая сумма к оплате
        # total_amount = subtotal + tax_amount
        total_amount = subtotal_dec + tax_amount

        # Собираем список примененных юрисдикций
        jurisdictions = ["New York State", f"{location['county']} County"]
        if special_rates > 0:
            jurisdictions.append("MCTD (Special)")

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