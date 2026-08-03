from pydantic import BaseModel

class ImageCreate(BaseModel):
    product_id: int
    url: str
    alt: str
    order: int
    is_active: bool


class ImageResponse(ImageCreate):
    id: int

    class Config:
        from_attributes = True


        