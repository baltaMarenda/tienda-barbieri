from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1)


class CategoryResponse(CategoryCreate):
    id: int

    class Config:
        from_attributes = True

class CategoryUpdate(BaseModel):
    name: str = Field(min_length=1)