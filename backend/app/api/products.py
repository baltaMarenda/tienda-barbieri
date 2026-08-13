from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate, ProductListResponse
from app.services import product_service
from app.models.user import User
from app.core.auth import get_current_admin

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/", response_model=ProductResponse)
async def create_products( product: ProductCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return product_service.create_product(db, product)


@router.get("/", response_model=ProductListResponse)
async def get_products(page: int = Query(1, ge=1), 
                       limit: int = Query(20, ge=1, le=100), 
                       db: Session = Depends(get_db), 
                       sort: str | None = Query(default=None),
                       category_id: int | None = Query(default=None, gt=0), 
                       search:str | None = Query(default=None, min_length=1)
                       ):
    return product_service.get_products_paginated(
        db, page, limit,
        sort = sort,
        category_id=category_id,
        search=search,
    )

@router.get("/{id}", response_model=ProductResponse)
async def get_product_by_id(id: int, db: Session = Depends(get_db)):
    return product_service.get_product_by_id(db,id)

@router.put("/{id}", response_model=ProductResponse)
async def update(id: int, product: ProductUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return product_service.update_product(db, id, product)

@router.delete("/{id}", response_model=ProductResponse)
async def delete(id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return product_service.delete_product(db, id)
  