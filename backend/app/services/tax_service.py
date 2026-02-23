import csv
import httpx
from pathlib import Path
from functools import lru_cache

class OutsideNYSException(Exception):
    pass

class TaxCalculatorService:
    def __init__(self):
        base_dir = Path(__file__).resolve().parent.parent
        self.dataset_path = base_dir / "utils" / "nys_tax_rates.csv"
        self.tax_data = self._load_dataset()

    def _load_dataset(self) -> list[dict]:
        data = []
        try:
            with open(self.dataset_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                # Колонки в реальном датасете могут называться иначе (например, "Jurisdiction" и "Tax Rate")
                # Мы сохраняем сырые строки, чтобы потом искать по ним
                for row in reader:
                    data.append(row)
        except FileNotFoundError:
            print("Датасет еще не скачан.")
        return data

    def reload_data(self):
        self.tax_data = self._load_dataset()

    async def _get_county_by_coords(self, lat: float, lon: float) -> str:
        """Использует бесплатное API OpenStreetMap для получения адреса по координатам."""
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        headers = {"User-Agent": "NYSTaxCalculator/1.0"} # OSM требует указывать User-Agent
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            address = data.get("address", {})
            state = address.get("state")
            
            if state != "New York":
                raise OutsideNYSException(f"Координаты находятся в штате {state}, а не в Нью-Йорке.")
                
            # Ищем округ (County) или город
            county = address.get("county") or address.get("city")
            if not county:
                raise ValueError("Не удалось определить округ по этим координатам.")
                
            # Убираем слово "County" для более легкого поиска в CSV (например, "Erie County" -> "Erie")
            return county.replace(" County", "").strip()

    async def get_raw_tax_data(self, latitude: float, longitude: float) -> dict:
        if not self.tax_data:
            raise RuntimeError("Датасет пуст. Сначала обновите его через /update-dataset.")

        # 1. Получаем округ по координатам
        county_name = await self._get_county_by_coords(latitude, longitude)
        print(f"Определен округ: {county_name}")

        # 2. Ищем округ в нашем скачанном реальном датасете
        # Так как мы не знаем точных названий колонок заранее, ищем совпадение названия округа в значениях
        for row in self.tax_data:
            # Проверяем все текстовые значения в строке (ignore case)
            if any(county_name.lower() in str(val).lower() for val in row.values()):
                row["raw_source"] = "nys_official_dataset"
                row["geocoded_county"] = county_name
                return row
                
        # Если не нашли точное совпадение
        return {"error": f"Округ {county_name} найден по координатам, но отсутствует в скачанном датасете налогов."}

@lru_cache()
def get_tax_service() -> TaxCalculatorService:
    return TaxCalculatorService()