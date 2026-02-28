import logging
import sys
import os
from passlib.context import CryptContext

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import Base, engine, SessionLocal
from app.db.models.models import Admin

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger(__name__)

def seed_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_exists = db.query(Admin).filter(Admin.email == "admin@example.com").first()
        if not admin_exists:
            hashed_password = pwd_context.hash("admin123")
            new_admin = Admin(email="admin@example.com", hashed_password=hashed_password)
            db.add(new_admin)
            db.commit()
            logger.info("✅ Адміністратор (admin) успішно створений.")
        else:
            logger.info("ℹ️ Адміністратор вже існує. Пропуск ініціалізації.")
    except Exception as e:
        logger.error(f"❌ Помилка під час ініціалізації бази даних: {e}")
        db.rollback()
    finally:
        db.close()