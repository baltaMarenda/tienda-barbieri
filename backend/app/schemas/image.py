from pydantic import BaseModel, Field

class ImageCreate(BaseModel):
    product_id: int = Field(gt=0)
    url: str = Field(min_length=1)
    alt: str = Field(min_length=1)
    order: int = Field(ge=0)
    is_active: bool

class ImageResponse(ImageCreate):
    id: int

    class Config:
        from_attributes = True

class ImageUpdate(BaseModel):
    product_id: int | None = Field(default=None, gt=0)
    url: str | None = Field(default=None, min_length=1)
    alt: str | None = Field(default=None, min_length=1)
    order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None
        