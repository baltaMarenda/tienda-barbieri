from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories import product_repository, category_repository
from app.schemas.product import ProductCreate, ProductUpdate, ProductListResponse

import math

def get_all_products(db: Session):
    return product_repository.get_all(db)


def get_product_by_id(db: Session, product_id: int) -> Product:
    product = product_repository.get_by_id(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


def create_product(db: Session, product_data: ProductCreate):
    category_id=product_data.category_id
    category = category_repository.get_by_id(db, category_id)
    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    new_product = Product(
        name=product_data.name,
        category_id=product_data.category_id,
        description=product_data.description,
        price=product_data.price,
        stock=product_data.stock,
    )
    return product_repository.create(db, new_product)

def update_product(db: Session, product_id: int, product_data: ProductUpdate):
    product = product_repository.get_by_id(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    category = category_repository.get_by_id(
        db,
        product_data.category_id
    )

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    for key, value in product_data.model_dump(exclude_unset=True).items():
        setattr(product, key, value)

    return product_repository.update(db, product) 

def delete_product(db:Session, product_id:int):
    product = product_repository.get_by_id(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )
    return product_repository.delete(db, product)

def get_products_paginated(db: Session, page: int, limit: int):
    productos, total = product_repository.get_paginated(db, page, limit)

    pages = math.ceil(total / limit)

    return ProductListResponse(
        items=productos,
        page=page,
        limit=limit,
        total=total,
        pages=pages
    )
