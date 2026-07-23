from fastapi import APIRouter, Depends

from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.category import CategoryCreate, CategoryResponse
from app.services import category_service

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.post("/", response_model=CategoryResponse)
async def create_categories(category:CategoryCreate, db: Session = Depends(get_db)):
    return category_service.create_category(db, category)

@router.get("/", response_model=list[CategoryResponse])
async def get_categories(db:Session = Depends(get_db)):
    return category_service.get_all_categories(db)

@router.get("/{id}", response_model=CategoryResponse)
async def get_by_id(category_id: int, db:Session = Depends(get_db)):
    return category_service.get_category_by_id(db, category_id)

@router.put("/{id}", response_model=CategoryCreate)
async def update(category_id: int, category_data:CategoryCreate, db:Session = Depends(get_db)):
    return category_service.update_category(db, category_id, category_data)

@router.delete("/{id}", response_model=CategoryResponse)
async def delete(category_id: int, db:Session = Depends(get_db)):
    return category_service.delete_category(db, category_id)




