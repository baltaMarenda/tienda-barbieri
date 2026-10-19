from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories import product_repository, category_repository
from app.schemas.product import ProductCreate, ProductUpdate, ProductListResponse
from app.core.media import delete_media_file

import math

CERAMIC_UNITS = {"box", "m2"}


def _check_units(product: Product):
    """Caja y m² sólo se pueden mezclar si sabemos cuántos m² trae cada caja."""
    units = {product.price_unit, product.stock_unit}

    if "unit" in units and len(units) > 1:
        raise HTTPException(
            status_code=422,
            detail="Price and stock must both be 'unit' or both use box/m2"
        )

    if units == CERAMIC_UNITS and not product.m2_per_box:
        raise HTTPException(
            status_code=422,
            detail="m2_per_box is required when price and stock use different units"
        )

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
        price_unit=product_data.price_unit,
        stock=product_data.stock,
        stock_unit=product_data.stock_unit,
        m2_per_box=product_data.m2_per_box,
    )
    _check_units(new_product)
    return product_repository.create(db, new_product)

def update_product(db: Session, product_id: int, product_data: ProductUpdate):
    product = product_repository.get_by_id(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product_data.category_id is not None:
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

    _check_units(product)

    return product_repository.update(db, product)

def delete_product(db:Session, product_id:int):
    product = product_repository.get_by_id(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    image_urls = [image.url for image in product.images]
    deleted = product_repository.delete(db, product)
    for url in image_urls:
        delete_media_file(url)

    return deleted

def get_products_paginated(db: Session, page: int, limit: int,sort: str | None = None, category_id:int | None = None, search:str | None = None):
    productos, total = product_repository.get_paginated(
        db, page, limit,
        sort=sort,
        category_id=category_id,
        search=search,
    )

    pages = math.ceil(total / limit)

    return ProductListResponse(
        items=productos,
        page=page,
        limit=limit,
        total=total,
        pages=pages
    )
