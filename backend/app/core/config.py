from pydantic_settings import BaseSettings, SettingsConfigDict
import os
class Settings(BaseSettings):
    """
    Головні налаштування додатку.
    Параметри завантажуються зі змінних середовища або файлу .env.
    """
    # Налаштування бази даних
    DATABASE_URL: str 
    
    # Базові податкові константи
    NY_STATE_TAX_RATE: float = 0.04
    NY_COUNTY_TAX_RATE: float = 0.04
    MCTD_TAX_RATE: float = 0.00375
    
    SECRET_KEY: str
    ALGORITHM: str 
    ACCESS_TOKEN_EXPIRE_MINUTES: int 

    # Географічні межі Нью-Йорка (Bounding Box)
    NY_LAT_MIN: float = 40.477399
    NY_LAT_MAX: float = 45.015865
    NY_LON_MIN: float = -79.762590
    NY_LON_MAX: float = -71.777491

    # Ігноруємо зайві змінні з .env, щоб не викликати помилок Pydantic
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()