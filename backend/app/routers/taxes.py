from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from datetime import datetime
from typing import Optional

from app.db.database import get_db
from app.db.models.models import Order
from app.schemas.order import OrdersListResponse
from app.services.import_service import ImportService
from app.services.tax_service import TaxCalculatorService, get_tax_service

router = APIRouter(prefix="/api/taxes", tags=["Taxes"])


@router.post("/update-dataset")
async def update_tax_dataset(
    tax_service: TaxCalculatorService = Depends(get_tax_service) 
):
    """
    Принудительно скачивает свежую версию датасета и обновляет кэш.
    """
    import_service = ImportService()
    
    success = await import_service.download_dataset()
    
    if not success:
        raise HTTPException(status_code=500, detail="Ошибка при скачивании датасета с сервера NY.")
    
    tax_service.reload_data()
    
    return {
        "status": "success", 
        "message": "Налоговый датасет успешно обновлен и загружен в память.",
        "records_loaded": len(tax_service.tax_data) 
    }
@router.get("/calculate")
async def calculate_tax(
    lat: float, 
    lon: float,
    tax_service: TaxCalculatorService = Depends(get_tax_service) 
):
    """
    Получает налоговую ставку по координатам.
    """
    try:
        data = await tax_service.get_raw_tax_data(lat, lon)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    