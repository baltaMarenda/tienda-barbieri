from typing import Literal

from pydantic import BaseModel, Field
from fastapi import Query

from app.schemas.image import ImageResponse

# "unit": unidad, "box": caja, "m2": metro cuadrado (rubros cerámicos).
SaleUnit = Literal["unit", "box", "m2"]

class ProductCreate(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None
    category_id: int = Field(gt=0)
    price: float = Field(ge=0)
    price_unit: SaleUnit = "unit"
    # None: sin stock cargado; se vende sin tope.
    stock: float | None = Field(default=None, ge=0)
    stock_unit: SaleUnit = "unit"
    m2_per_box: float | None = Field(default=None, gt=0)


class ProductResponse(ProductCreate):
    id: int
    # Galería ordenada por `order` (incluye inactivas: el front las filtra).
    # Viene en la misma respuesta para no tener que pedir GET /images/ entero.
    images: list[ImageResponse] = []

    class Config:
        from_attributes = True

class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    category_id: int | None = Field(default=None, gt=0)
    price: float | None = Field(default=None, ge=0)
    price_unit: SaleUnit | None = None
    stock: float | None = Field(default=None, ge=0)
    stock_unit: SaleUnit | None = None
    m2_per_box: float | None = Field(default=None, gt=0)

class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    page: int = Query(1, ge=1)
    limit: int = Query(20, ge=1, le=100)
    total: int
    pages: int
