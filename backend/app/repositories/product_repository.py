from sqlalchemy.orm import Session
from app.models.product import Product


def get_all(db: Session):
    return db.query(Product).all()


def get_by_id(db: Session, product_id: int):
    return db.query(Product).filter_by(id=product_id).first()


def create(db: Session, product: Product):
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

def update(db: Session, product: Product):
    db.commit()
    db.refresh(product)
    return product

def delete(db: Session, product: Product):
    db.delete(product)
    db.commit()
    return product

def get_paginated(db: Session, page: int, limit: int, sort: str | None = None,category_id:int | None = None, search: str | None = None):
    offset = (page - 1) * limit
    query = db.query(Product)

    if category_id:
        query = query.filter(Product.category_id == category_id)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())

    total = query.count()
    productos = query.offset(offset).limit(limit).all()

    return productos, total