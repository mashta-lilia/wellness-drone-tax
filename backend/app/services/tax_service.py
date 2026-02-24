import csv
import httpx
from pathlib import Path
from functools import lru_cache

class TaxCalculatorService:
    def __init__(self):
        # 1. Находим путь к файлу
        base_dir = Path(__file__).resolve().parent.parent.parent
        self.dataset_path = base_dir / "utils" / "nys_tax_rates.csv"
        
        # 2. Загружаем данные в словарь для быстрого поиска: {"nassau": 0.08625, ...}
        self.rates_cache = self._load_data()

    def _load_data(self) -> dict:
        rates = {}
        try:
            with open(self.dataset_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    # Ключ - название округа (маленькими буквами), значение - число
                    county = row["County"].strip().lower()
                    rate = float(row["Rate"])
                    rates[county] = rate
            print(f"Загружено налоговых ставок: {len(rates)}")
        except FileNotFoundError:
            print("ОШИБКА: Файл nys_tax_rates.csv не найден!")
        return rates

    async def get_tax_rate(self, lat: float, lon: float) -> float:
        """
        Главный метод: по координатам возвращает % налога (например 0.08875)
        """
        # 1. Узнаем, что за округ, через OpenStreetMap
        county_name = await self._get_county_from_osm(lat, lon)
        print(f"Координаты {lat},{lon} -> Округ: {county_name}")

        # 2. Ищем в нашем словаре (безопасно, в нижнем регистре)
        # Если не нашли, возвращаем дефолт 8.875% (как в NYC)
        return self.rates_cache.get(county_name.lower(), 0.08875)

    async def _get_county_from_osm(self, lat: float, lon: float) -> str:
        """Стучится в API и получает название округа"""
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {"User-Agent": "WellnessDroneTax/1.0"} 
        
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(url, headers=headers, timeout=10.0)
                data = resp.json()
                
                address = data.get("address", {})
                # OSM может вернуть "Kings County", нам нужно просто "Kings"
                county = address.get("county") or address.get("city") or "New York"
                
                return county.replace(" County", "").strip()
            except Exception as e:
                print(f"Ошибка OSM: {e}")
                return "New York" # Фолбэк, если API упал

@lru_cache()
def get_tax_service() -> TaxCalculatorService:
    return TaxCalculatorService()