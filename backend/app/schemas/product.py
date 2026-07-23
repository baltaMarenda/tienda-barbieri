from pydantic import BaseModel


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    category_id: int
    price: float
    stock: int


class ProductResponse(ProductCreate):
    id: int

    class Config:
        from_attributes = True