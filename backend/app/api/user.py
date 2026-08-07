from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services import user_service
from app.core.auth import get_current_user, get_current_admin
from app.models.user import User

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse)
async def create_user(user: UserCreate, db:Session = Depends(get_db)):
    return user_service.create_user(db, user)

@router.get("/", response_model=list[UserResponse])
async def get_users(db:Session = Depends(get_db)):
    return user_service.get_all_users(db)

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user

@router.get("/admin-test")
async def admin_test(
    current_admin: User = Depends(get_current_admin,
    )
):
    return {
        "message": "Sos admin",
        "user_id": current_admin.id
    }

@router.get("/{id}", response_model=UserResponse)
async def get_user_by_id(id:int, db:Session = Depends(get_db)):
    return user_service.get_user_by_id(db,id)

@router.put("/{id}", response_model=UserResponse)
async def update(id: int, user: UserCreate, db: Session = Depends(get_db)):
    return user_service.update_user(db, id, user)

@router.delete("/{id}", response_model=UserResponse)
async def delete(id: int, db: Session = Depends(get_db)):
    return user_service.delete_user(db, id)