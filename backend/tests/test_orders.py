import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_create_order_nyc():
    # Емулюємо запит до нашого FastAPI додатка
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/api/orders/", json={
            "subtotal": 100.0,
            "latitude": 40.7128,
            "longitude": -74.0060
        })
    
    # Перевіряємо результат
    assert response.status_code == 201
    data = response.json()
    assert data["composite_tax_rate"] == 0.08875
    assert data["tax_amount"] == 8.88
    assert data["total_amount"] == 108.88