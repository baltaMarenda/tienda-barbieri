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


