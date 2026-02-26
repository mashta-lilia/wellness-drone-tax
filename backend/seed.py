def seed_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.username == "admin").first()
        if not admin_exists:
            # Використовуємо просте хешування для MVP
            hashed_password = pwd_context.hash("admin123")
            new_admin = User(username="admin", password_hash=hashed_password)
            db.add(new_admin)
            db.commit()
            print("✅ Seeder: Адмін (admin/admin123) створений!")
        else:
            print("ℹ️ Seeder: Адмін вже є.")
    except Exception as e:
        print(f"❌ Помилка сідінгу: {str(e)[:100]}")
        db.rollback()
    finally:
        db.close()