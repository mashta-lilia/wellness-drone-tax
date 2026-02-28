# backend/create_admin.py
from app.db.database import SessionLocal
from app.db.models.models import Admin
from app.core.security import get_password_hash

def create_superuser():
    db = SessionLocal()
    email = "admin@test.com"
    password = "supersecretpassword"

    # Проверяем, нет ли уже такого админа
    existing_admin = db.query(Admin).filter(Admin.email == email).first()
    if existing_admin:
        print(f"Админ {email} уже существует в базе!")
    else:
        # Создаем нового
        new_admin = Admin(
            email=email,
            hashed_password=get_password_hash(password)
        )
        db.add(new_admin)
        db.commit()
        print(f"Суперпользователь {email} успешно создан!")
    
    db.close()

if __name__ == "__main__":
    create_superuser()