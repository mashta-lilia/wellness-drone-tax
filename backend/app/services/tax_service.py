import json
import os
import logging
import shapely
import numpy as np
import pandas as pd
from fastapi import HTTPException
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

logger = logging.getLogger(__name__)

class TaxCalculatorService:
    """
    Сервіс для геопросторового розрахунку податків на доставку у штаті Нью-Йорк.
    Використовує R-Tree для швидкого пошуку юрисдикцій за координатами.
    """
    def __init__(self):
        self.polygons = []
        self.county_names = []
        self.spatial_index = None
        
        self._load_geodata()
        
        self.state_tax_rate = 0.04
        self.mctd_rate = 0.00375
        
        self.mctd_counties = [
            "New York", "Bronx", "Kings", "Queens", "Richmond", 
            "Rockland", "Nassau", "Suffolk", "Orange", "Putnam", "Dutchess", "Westchester"
        ]
        
        self.nyc_counties = ["New York", "Bronx", "Kings", "Queens", "Richmond"]
        self.nyc_city_rate = 0.045
        
        self.county_tax_rates = {
            "Erie": 0.0475, "Oneida": 0.0475,
            "Allegany": 0.045,
            "Nassau": 0.0425, "Suffolk": 0.0425, "Herkimer": 0.0425,
            "Dutchess": 0.0375, "Orange": 0.0375,
            "Ontario": 0.035,
            "Saratoga": 0.03, "Warren": 0.03, "Washington": 0.03
        }

    def _load_geodata(self):
        """Завантажує GeoJSON та ініціалізує просторовий індекс (R-Tree)."""
        filepath = os.path.join(os.path.dirname(__file__), "..", "data", "ny_counties.geojson")
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for feature in data.get('features', []):
                    name = feature['properties'].get('name', '').replace(' County', '').strip()
                    
                    # Буфер 0.001 градуса (~100м) для обробки локацій на мостах або узбережжях
                    polygon = shape(feature['geometry']).buffer(0.001).simplify(0.002)
                    
                    self.polygons.append(polygon)
                    self.county_names.append(name)
                
                self.spatial_index = STRtree(self.polygons)
            logger.info("Просторовий індекс геоданих NY успішно ініціалізовано.")
        except Exception as e:
            logger.error(f"Помилка завантаження геоданих NY: {e}")

    def _get_county_by_coords(self, lat: float, lon: float) -> str:
        """Пошук округу за координатами через просторовий індекс."""
        if not self.spatial_index: 
            return None
        point = Point(lon, lat) 
        candidate_indices = self.spatial_index.query(point)
        for idx in candidate_indices:
            if self.polygons[idx].contains(point):
                return self.county_names[idx]
        return None 

    async def calculate_full_tax_info(self, lat: float, lon: float, subtotal: float) -> dict:
        """Розрахунок податків для одиночного замовлення з точним розподілом юрисдикцій."""
        county = self._get_county_by_coords(lat, lon)
        if not county:
            raise HTTPException(status_code=400, detail="Точка знаходиться поза межами штату Нью-Йорк.")

        is_nyc = county in self.nyc_counties
        
        city_rate = self.nyc_city_rate if is_nyc else 0.0
        county_rate = 0.0 if is_nyc else self.county_tax_rates.get(county, 0.04)
        special_rate = self.mctd_rate if county in self.mctd_counties else 0.0
        
        total_rate = self.state_tax_rate + county_rate + city_rate + special_rate
        tax_amount = subtotal * total_rate

        jurisdictions = ["New York State"]
        if is_nyc:
            jurisdictions.extend(["New York City", f"{county} County (Borough)"])
        else:
            jurisdictions.append(f"{county} County")

        return {
            "composite_tax_rate": round(total_rate, 5),
            "tax_amount": round(tax_amount, 2),
            "total_amount": round(subtotal + tax_amount, 2),
            "breakdown": {
                "state_rate": self.state_tax_rate,
                "county_rate": county_rate,
                "city_rate": city_rate,
                "special_rates": special_rate
            },
            "jurisdictions": jurisdictions
        }

    def enrich_dataframe_with_taxes(self, df: pd.DataFrame):
        """Векторизована обробка податків для масиву замовлень (Pandas DataFrame)."""
        points = shapely.points(df['longitude'], df['latitude'])
        pt_idx, poly_idx = self.spatial_index.query(points, predicate='intersects')
        
        df['county'] = None
        if len(pt_idx) > 0:
            county_array = np.array(self.county_names)
            df.iloc[pt_idx, df.columns.get_loc('county')] = county_array[poly_idx]

        valid_df = df[df['county'].notnull()].copy()
        invalid_df = df[df['county'].isnull()].copy()
        
        if valid_df.empty:
            return valid_df, invalid_df

        valid_df['state_tax_rate'] = self.state_tax_rate
        valid_df['is_nyc'] = valid_df['county'].isin(self.nyc_counties)
        
        valid_df['city_rate'] = np.where(valid_df['is_nyc'], self.nyc_city_rate, 0.0)
        valid_df['county_tax_rate'] = np.where(
            valid_df['is_nyc'], 
            0.0, 
            valid_df['county'].map(self.county_tax_rates).fillna(0.04)
        )
        
        valid_df['mctd_rate'] = 0.0
        is_mctd = valid_df['county'].isin(self.mctd_counties)
        valid_df.loc[is_mctd, 'mctd_rate'] = self.mctd_rate
        
        valid_df['composite_tax_rate'] = valid_df['state_tax_rate'] + valid_df['county_tax_rate'] + valid_df['city_rate'] + valid_df['mctd_rate']
        valid_df['tax_amount'] = valid_df['subtotal'] * valid_df['composite_tax_rate']
        valid_df['total_amount'] = valid_df['subtotal'] + valid_df['tax_amount']
        
        valid_df['breakdown'] = [
            json.dumps({"state_rate": sr, "county_rate": cr, "city_rate": cir, "special_rates": mr})
            for sr, cr, cir, mr in zip(valid_df['state_tax_rate'], valid_df['county_tax_rate'], valid_df['city_rate'], valid_df['mctd_rate'])
        ]
        
        valid_df['jurisdictions'] = [
            json.dumps(["New York State", "New York City", f"{county} County"] if is_nyc else ["New York State", f"{county} County"])
            for county, is_nyc in zip(valid_df['county'], valid_df['is_nyc'])
        ]
        
        return valid_df, invalid_df

_instance = None

def get_tax_service():
    global _instance
    if _instance is None:
        _instance = TaxCalculatorService()
    return _instance