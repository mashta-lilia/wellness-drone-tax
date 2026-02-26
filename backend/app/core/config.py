from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Налаштування бази даних
    DATABASE_URL: str = "sqlite:///./wellness_delivery.db"
    
    # Податкові ставки (значення за замовчуванням)
    NY_STATE_TAX_RATE: float = 0.04
    NY_COUNTY_TAX_RATE: float = 0.04
    MCTD_TAX_RATE: float = 0.00375
    
    # Географічні межі Нью-Йорка (Bounding Box)
    NY_LAT_MIN: float = 40.477399
    NY_LAT_MAX: float = 45.015865
    NY_LON_MIN: float = -79.762590
    NY_LON_MAX: float = -71.777491

    # Дозволяємо читання з .env файлу
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()