import logging

# Налаштування логера для виводу в консоль Docker
logger = logging.getLogger(__name__)

def seed_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.username == "admin").first()
        if not admin_exists:
            hashed_password = pwd_context.hash("admin123")
            new_admin = User(username="admin", password_hash=hashed_password)
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