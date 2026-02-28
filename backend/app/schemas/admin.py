# app/schemas/user.py
from pydantic import BaseModel, EmailStr

class AdminCreate(BaseModel):
    email: EmailStr
    password: str

class AdminResponse(BaseModel):
    id: str
    email: EmailStr
    is_active: bool

    class Config:
        from_attributes = True