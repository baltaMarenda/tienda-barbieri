from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.product import SaleUnit

PaymentMethod = Literal["cash", "transfer", "card"]
ShippingMethod = Literal["pickup", "delivery"]
OrderStatus = Literal["received", "delivered"]


class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=1)


class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1)
    customer_phone: str = Field(min_length=6)
    customer_locality: str | None = None
    payment_method: PaymentMethod
    shipping_method: ShippingMethod
    shipping_address: str | None = None
    notes: str | None = None
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderItemResponse(BaseModel):
    id: int
    product_id: int | None
    product_name: str
    unit: SaleUnit
    unit_price: float
    quantity: int

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    customer_name: str
    customer_phone: str
    customer_locality: str | None
    payment_method: PaymentMethod
    shipping_method: ShippingMethod
    shipping_address: str | None
    notes: str | None
    total: float
    status: OrderStatus
    created_at: datetime
    items: list[OrderItemResponse]

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    page: int
    limit: int
    total: int
    pages: int
