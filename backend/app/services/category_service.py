from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories import category_repository
from app.schemas.category import CategoryCreate, CategoryUpdate

def create_category(db:Session, categry_data:CategoryCreate):
    new_category = Category(
        name = categry_data.name
    )
    return category_repository.create(db, new_category)

def get_all_categories(db: Session):
    return category_repository.get_all(db)


def get_category_by_id(db: Session, category_id: int) -> Category:
    category = category_repository.get_by_id(db, category_id)
    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return category

def update_category(db:Session, category_id:int, category_data: CategoryUpdate):
    category = category_repository.get_by_id(db, category_id)

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    for key, value in category_data.model_dump(exclude_unset=True).items():
        setattr(category, key, value)

    return category_repository.update(db, category)

def delete_category(db:Session, category_id:int):
    category = category_repository.get_by_id(db, category_id)

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    if category.products:
        raise HTTPException(
            status_code=409,
            detail="Category has products assigned"
        )

    return category_repository.delete(db, category)

