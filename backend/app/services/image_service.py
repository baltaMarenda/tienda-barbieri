from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.image import Image
from app.repositories import image_repository, product_repository
from app.schemas.image import ImageCreate

def get_all_images(db:Session):
    return image_repository.get_all(db)

def get_image_by_id(db:Session, image_id: int) -> Image:
    image = image_repository.get_by_id(db, image_id)

    if image is None:
        raise HTTPException(
            status_code=404,
            detail="Image not found"
        )
    return image

def create_image(db:Session, image_data: ImageCreate):
    product_id = image_data.product_id
    product = product_repository.get_by_id(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    new_image = Image(
        product_id=image_data.product_id,
        url=image_data.url,
        alt=image_data.alt,
        order=image_data.order,
        is_active=image_data.is_active
    )

    return image_repository.create(db, new_image)

def update_image(db:Session, image_id:int, image_data:ImageCreate):
    image = image_repository.get_by_id(db, image_id)

    if image is None:
        raise HTTPException(
            status_code=404,
            detail="Image not found"
        )

    product = product_repository.get_by_id(db, image_data.product_id)

    if product is None:
       raise HTTPException(
            status_code=404,
            detail="Product not found"
    )
    
    for key, value in image_data.model_dump().items():
        setattr(image, key, value)

    return image_repository.update(db, image)

def delete_image(db:Session, image_id:int):
    image = image_repository.get_by_id(db, image_id)

    if image is None:
        raise HTTPException(
            status_code=404,
            detail="Image not found"
        )

    return image_repository.delete(db, image)