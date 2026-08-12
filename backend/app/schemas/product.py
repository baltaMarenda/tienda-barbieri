from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None
    category_id: int = Field(gt=0)
    price: float = Field(ge=0)
    stock: int = Field(ge=0)


class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True

class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None
    category_id: int | None = Field(default=None, gt=0)
    price: float | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)

class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    page: int
    limit: int
    total: int
    pages: int
