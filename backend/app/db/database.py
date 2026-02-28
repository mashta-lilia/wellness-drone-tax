from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """
    Оптимізація SQLite для високопродуктивного масового запису (bulk insert).
    Вмикає WAL (Write-Ahead Logging) та виконання транзакцій у пам'яті.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=OFF")
    cursor.execute("PRAGMA temp_store=MEMORY")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Генератор сесій бази даних для Dependency Injection у FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()