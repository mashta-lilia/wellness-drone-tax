# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models.models import Admin
from app.schemas.admin import AdminCreate, AdminResponse
from app.core.security import get_password_hash
from datetime import timedelta
from fastapi.security import OAuth2PasswordRequestForm
from app.core.security import verify_password, create_access_token
from app.core.config import settings

router = APIRouter(
    prefix="/api/admins",
    tags=["admins"]
)
@router.post("/login", response_model=dict)
def login_admin(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # 1. Ищем админа в базе. 
    # Важно: OAuth2PasswordRequestForm всегда ожидает поле 'username', 
    # поэтому мы передаем email с фронтенда в поле username.
    admin = db.query(Admin).filter(Admin.email == form_data.username).first()
    
    # 2. Проверяем, существует ли админ и совпадает ли пароль
    if not admin or not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 3. Генерируем срок действия токена
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 4. Создаем сам JWT токен
    access_token = create_access_token(
        data={"sub": admin.email}, expires_delta=access_token_expires
    )
    
    # 5. Возвращаем токен в стандартном формате
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=AdminResponse, status_code=status.HTTP_201_CREATED)
def register_admin(admin: AdminCreate, db: Session = Depends(get_db)):
    # Проверка, существует ли уже админ с таким email
    db_admin = db.query(Admin).filter(Admin.email == admin.email).first()
    if db_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Хеширование пароля
    hashed_password = get_password_hash(admin.password)
    
    # Создание нового админа
    new_admin = Admin(
        email=admin.email,
        hashed_password=hashed_password
    )
    
    # Сохранение в базу данных
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)
    
    return new_admin