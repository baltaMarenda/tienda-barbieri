from sqlalchemy.orm import Session, selectinload
from app.models.order import Order


def get_by_id(db: Session, order_id: int):
    return db.query(Order).filter_by(id=order_id).first()


def create(db: Session, order: Order):
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

def update(db: Session, order: Order):
    db.commit()
    db.refresh(order)
    return order

def get_paginated(db: Session, page: int, limit: int, status: str | None = None):
    offset = (page - 1) * limit
    query = db.query(Order)

    if status:
        query = query.filter(Order.status == status)

    total = query.count()
    pedidos = (
        query.options(selectinload(Order.items))
        .order_by(Order.created_at.desc(), Order.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return pedidos, total
