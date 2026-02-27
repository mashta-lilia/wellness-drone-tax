import json
import os
import logging
from fastapi import HTTPException
from shapely.geometry import Point, shape
from shapely.strtree import STRtree
from app.core.config import settings
import pandas as pd
import shapely 
import numpy as np 
import json

logger = logging.getLogger(__name__)

class TaxCalculatorService:
    def __init__(self):
        # Структури даних для дерева та геометрії
        self.polygons = []
        self.county_names = []
        self.spatial_index = None
        
        # Ініціалізація R-дерева при старті
        self._load_geodata()
        
        # Бізнес-логіка: Податкові ставки
        self.state_tax_rate = 0.04 # 4%
        self.mctd_rate = 0.00375   # 0.375%
        
        # Окремий список округів міста Нью-Йорк (NYC)
        self.nyc_counties = ["New York", "Bronx", "Kings", "Queens", "Richmond"]
        
        # Решта округів, що входять в зону MCTD (транспортний налог)
        self.other_mctd_counties = ["Rockland", "Nassau", "Suffolk", "Orange", "Putnam", "Dutchess", "Westchester"]
        
        # Об'єднаний список для перевірки наявності MCTD
        self.mctd_counties = self.nyc_counties + self.other_mctd_counties

    def _load_geodata(self):
        """Завантаження з мінімальним буфером для точності."""
        filepath = os.path.join(os.path.dirname(__file__), "..", "data", "ny_counties.geojson")
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for feature in data.get('features', []):
                    name = feature['properties'].get('name', '').replace(' County', '').strip()
                    
                    polygon = shape(feature['geometry'])
                    
                    # Наш "хірургічний" буфер у 100 метрів (0.001)
                    buffered_polygon = polygon.buffer(0.001)
                    final_polygon = buffered_polygon.simplify(0.002)
                    
                    self.polygons.append(final_polygon)
                    self.county_names.append(name)
                
                self.spatial_index = STRtree(self.polygons)
            logger.info("🚀 Геодані завантажено з точним буфером 100м.")
        
        # ОСЬ ЦЕЙ БЛОК БУВ ВІДСУТНІЙ:
        except Exception as e:
            logger.error(f"❌ Помилка завантаження геоданих: {e}")

    def _get_county_by_coords(self, lat: float, lon: float) -> str:
        """Пошук округу за координатами через R-дерево за O(log N)."""
        if not self.spatial_index:
            logger.error("Просторовий індекс не ініціалізовано!")
            return None

        # Створюємо точку (Довгота, Широта)
        point = Point(lon, lat) 
        
        # 1. Дерево миттєво відсікає непотрібне і повертає індекси кандидатів (Bounding Boxes)
        candidate_indices = self.spatial_index.query(point)
        
        # 2. Точна перевірка 'contains' ТІЛЬКИ для відфільтрованих кандидатів (зазвичай 1-2 полігони)
        for idx in candidate_indices:
            if self.polygons[idx].contains(point):
                return self.county_names[idx]
        
        return None 

    # ДОДАНО ASYNC ТУТ:
    async def calculate_full_tax_info(self, lat: float, lon: float, subtotal: float) -> dict:
        """Головний метод розрахунку податків."""
        
        # Блискавичний пошук округу в пам'яті
        county_name = self._get_county_by_coords(lat, lon)
        
        if not county_name:
            raise HTTPException(
                status_code=400, 
                detail=f"Координати ({lat}, {lon}) знаходяться за межами штату Нью-Йорк. Доставка неможлива."
            )

        # Розрахунок податків
        state_tax = subtotal * self.state_tax_rate
        
        # Заглушка для податку округу (в майбутньому можна тягнути з БД)
        county_tax_rate = 0.04 
        county_tax = subtotal * county_tax_rate
        
        # Перевірка на спеціальний податок MCTD
        mctd_tax = 0.0
        if county_name in self.mctd_counties:
            mctd_tax = subtotal * self.mctd_rate

        total_tax = state_tax + county_tax + mctd_tax
        composite_rate = self.state_tax_rate + county_tax_rate + (self.mctd_rate if county_name in self.mctd_counties else 0.0)

        return {
            "composite_tax_rate": round(composite_rate, 5),
            "tax_amount": round(total_tax, 2),
            "total_amount": round(subtotal + total_tax, 2),
            "breakdown": {
                "state_rate": self.state_tax_rate,
                "county_rate": county_tax_rate,
                "city_rate": 0.0,
                "special_rates": self.mctd_rate if county_name in self.mctd_counties else 0.0
            },
            "jurisdictions": ["New York State", f"{county_name} County"]
        }
    
    def enrich_dataframe_with_taxes(self, df: pd.DataFrame):
        """АБСОЛЮТНА ВЕКТОРИЗАЦІЯ: 15 000 точок за 0.01 секунди."""
        
        # Перетворюємо колонки широти/довготи на C-масив точок миттєво
        points = shapely.points(df['longitude'], df['latitude'])
        
        # ПРАВИЛЬНИЙ ПОРЯДОК: спочатку точки, потім полігони
        point_indices, poly_indices = self.spatial_index.query(points, predicate='intersects')
        
        # Створюємо порожню колонку і заповнюємо її через масиви NumPy
        df['county'] = None
        if len(point_indices) > 0:
            county_array = np.array(self.county_names)
            # Тепер все зійдеться!
            df.iloc[point_indices, df.columns.get_loc('county')] = county_array[poly_indices]

        # Відфільтровуємо тих, хто не в Нью-Йорку
        valid_df = df[df['county'].notnull()].copy()
        invalid_df = df[df['county'].isnull()].copy() # <--- Зберігаємо список "поганих" рядків
        
        if valid_df.empty:
            return valid_df, invalid_df # <--- Повертаємо датафрейм, а не число

        # 2. ВЕКТОРНА МАТЕМАТИКА 
        valid_df['state_tax_rate'] = self.state_tax_rate
        valid_df['county_tax_rate'] = 0.04 
        
        valid_df['mctd_rate'] = 0.0
        is_mctd = valid_df['county'].isin(self.mctd_counties)
        valid_df.loc[is_mctd, 'mctd_rate'] = self.mctd_rate
        
        valid_df['composite_tax_rate'] = valid_df['state_tax_rate'] + valid_df['county_tax_rate'] + valid_df['mctd_rate']
        valid_df['tax_amount'] = valid_df['subtotal'] * valid_df['composite_tax_rate']
        valid_df['total_amount'] = valid_df['subtotal'] + valid_df['tax_amount']
        

        valid_df['breakdown'] = [
            json.dumps({  
                "state_rate": sr,
                "county_rate": cr,
                "city_rate": 0.0,
                "special_rates": mr
            })
            for sr, cr, mr in zip(
                valid_df['state_tax_rate'], 
                valid_df['county_tax_rate'], 
                valid_df['mctd_rate']
            )
        ]
        
        valid_df['jurisdictions'] = [
            json.dumps(["New York State", f"{county} County"]) 
            for county in valid_df['county']
        ]
        
        # ВИПРАВЛЕНО ТУТ: повертаємо invalid_df
        return valid_df, invalid_df

_tax_service_instance = None

def get_tax_service():
    global _tax_service_instance
    if _tax_service_instance is None:
        _tax_service_instance = TaxCalculatorService()
    return _tax_service_instance