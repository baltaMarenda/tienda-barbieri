from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories import user_repository
from app.schemas.user import UserCreate

def get_all_users(db:Session):
    return user_repository.get_all(db)

def get_user_by_id(db:Session, user_id:int):
    user = user_repository.get_by_id(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return user

def update_user(db:Session, user_id:int, user_data:UserCreate):
    user = user_repository.get_by_id(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.name = user_data.name
    user.email = user_data.email
    user.password_hash = user_data.password

    return user_repository.update(db, user)

def create_user(db:Session, user_data:UserCreate):
    new_user = User (
        name = user_data.name,
        email = user_data.email,
        password_hash = user_data.password,
        role = "customer",
        is_active = True,
    )

    return user_repository.create(db, new_user)


def delete_user(db:Session, user_id:int):
    user = user_repository.get_by_id(db, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user_repository.delete(db, user)

