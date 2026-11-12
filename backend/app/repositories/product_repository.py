from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from app.models.product import Product


def get_all(db: Session):
    return db.query(Product).all()


def get_by_id(db: Session, product_id: int):
    return (
        db.query(Product)
        .options(selectinload(Product.images))
        .filter_by(id=product_id)
        .first()
    )


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

    # Orden estable: sin él, Postgres puede repetir o saltear filas entre páginas.
    query = query.order_by(Product.id)

    # El total viaja en cada fila (COUNT(*) OVER ()): una sola ida y vuelta a la
    # base en vez de COUNT + SELECT. Las imágenes se traen en un segundo SELECT
    # (selectinload) para todos los productos de la página juntos.
    rows = (
        query.add_columns(func.count().over().label("total"))
        .options(selectinload(Product.images))
        .offset(offset)
        .limit(limit)
        .all()
    )

    if rows:
        return [row[0] for row in rows], rows[0].total

    # Página fuera de rango: no hay filas de donde leer el total.
    total = query.order_by(None).count() if page > 1 else 0
    return [], total