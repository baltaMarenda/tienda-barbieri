from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db:Session = Depends(get_db)):
    return user_service.create_user(db, user)

@router.get("/", response_model=list[UserResponse])
async def get_users(db:Session = Depends(get_db)):
    return user_service.get_all_users(db)

@router.get("/{id}", response_model=UserResponse)
async def get_user_by_id(id:int, db:Session = Depends(get_db)):
    return user_service.get_user_by_id(db,id)

@router.put("/{id}", response_model=UserResponse)
async def update(id: int, user: UserCreate, db: Session = Depends(get_db)):
    return user_service.update_user(db, id, user)

@router.delete("/{id}", response_model=UserResponse)
async def delete(id: int, db: Session = Depends(get_db)):
    return user_service.delete_user(db, id)