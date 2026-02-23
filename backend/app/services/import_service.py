import httpx
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImportService:
    def __init__(self):
        base_dir = Path(__file__).resolve().parent.parent
        self.file_path = base_dir / "utils" / "nys_tax_rates.csv"

        self.dataset_url = "https://data.ny.gov/api/views/x8bw-q2g6/rows.csv?accessType=DOWNLOAD"

    async def download_dataset(self) -> bool:
        logger.info(f"Начинаем загрузку реального датасета с {self.dataset_url}...")
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(self.dataset_url, follow_redirects=True)
                response.raise_for_status()
                
                with open(self.file_path, "wb") as file:
                    file.write(response.content)
                    
            logger.info("Успешно! Боевой датасет NYS сохранен.")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при скачивании боевого датасета: {e}")
            return False