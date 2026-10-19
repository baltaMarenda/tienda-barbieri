from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.repositories import order_repository, product_repository
from app.schemas.order import OrderCreate, OrderListResponse, OrderStatusUpdate

import math


def _sale_terms(product: Product):
    """
    Misma regla que `saleTerms` del front (frontend/src/lib/units.ts): si se
    conocen los m² por caja, los cerámicos se venden por cajas completas.
    Devuelve (unidad, precio por unidad, cantidad entera disponible).
    """
    m2_per_box = product.m2_per_box if product.m2_per_box and product.m2_per_box > 0 else None
    ceramic = product.price_unit != "unit" or product.stock_unit != "unit"

    if ceramic and m2_per_box:
        unit_price = product.price * m2_per_box if product.price_unit == "m2" else product.price
        # El epsilon evita que 14,4 m² / 1,44 m² por caja dé 9,999… cajas.
        boxes = product.stock / m2_per_box + 1e-9 if product.stock_unit == "m2" else product.stock
        return "box", unit_price, math.floor(boxes)

    return product.price_unit, product.price, math.floor(product.stock)


def create_order(db: Session, order_data: OrderCreate):
    address = (order_data.shipping_address or "").strip() or None
    if order_data.shipping_method == "delivery" and address is None:
        raise HTTPException(
            status_code=422,
            detail="shipping_address is required for delivery"
        )

    # Si el carrito trae el mismo producto dos veces se suma en una línea.
    quantities: dict[int, int] = {}
    for item in order_data.items:
        quantities[item.product_id] = quantities.get(item.product_id, 0) + item.quantity

    items = []
    total = 0.0
    for product_id, quantity in quantities.items():
        product = product_repository.get_by_id(db, product_id)
        if product is None:
            raise HTTPException(
                status_code=404,
                detail=f"Product {product_id} not found"
            )

        unit, unit_price, available = _sale_terms(product)
        if quantity > available:
            raise HTTPException(
                status_code=409,
                detail=f"Not enough stock for '{product.name}' (available: {available})"
            )

        items.append(OrderItem(
            product_id=product.id,
            product_name=product.name,
            unit=unit,
            unit_price=unit_price,
            quantity=quantity,
        ))
        total += unit_price * quantity

    new_order = Order(
        customer_name=order_data.customer_name.strip(),
        customer_phone=order_data.customer_phone.strip(),
        payment_method=order_data.payment_method,
        shipping_method=order_data.shipping_method,
        shipping_address=address if order_data.shipping_method == "delivery" else None,
        notes=(order_data.notes or "").strip() or None,
        total=total,
        status="received",
        items=items,
    )
    return order_repository.create(db, new_order)


def update_order_status(db: Session, order_id: int, status_data: OrderStatusUpdate):
    order = order_repository.get_by_id(db, order_id)

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    order.status = status_data.status
    return order_repository.update(db, order)


def get_orders_paginated(db: Session, page: int, limit: int, status: str | None = None):
    pedidos, total = order_repository.get_paginated(db, page, limit, status=status)

    return OrderListResponse(
        items=pedidos,
        page=page,
        limit=limit,
        total=total,
        pages=math.ceil(total / limit)
    )
