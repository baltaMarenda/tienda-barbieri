from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate, OrderListResponse
from app.services import order_service
from app.models.user import User
from app.core.auth import get_current_admin

router = APIRouter(prefix="/orders", tags=["Orders"])


# Público: lo usa el checkout de la tienda, sin cuenta de cliente.
@router.post("/", response_model=OrderResponse)
async def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    return order_service.create_order(db, order)


@router.get("/", response_model=OrderListResponse)
async def get_orders(page: int = Query(1, ge=1),
                     limit: int = Query(20, ge=1, le=100),
                     status: Literal["received", "delivered"] | None = Query(default=None),
                     db: Session = Depends(get_db),
                     current_admin: User = Depends(get_current_admin)):
    return order_service.get_orders_paginated(db, page, limit, status=status)


@router.put("/{id}/status", response_model=OrderResponse)
async def update_status(id: int, status_data: OrderStatusUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return order_service.update_order_status(db, id, status_data)
