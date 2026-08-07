from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.deps import get_db

from app.schemas.auth import LoginRequest, TokenResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Login"])

@router.post("/login", response_model=TokenResponse)
async def login(login_data:LoginRequest, db:Session = Depends(get_db)):
    return auth_service.login(db, login_data)