from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.image import Image
from app.repositories import image_repository, product_repository
from app.schemas.image import ImageCreate, ImageUpdate
from app.core.media import save_product_image, delete_media_file

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

def update_image(db:Session, image_id:int, image_data:ImageUpdate):
    image = image_repository.get_by_id(db, image_id)

    if image is None:
        raise HTTPException(
            status_code=404,
            detail="Image not found"
        )

    if image_data.product_id is not None:
        product = product_repository.get_by_id(db, image_data.product_id)

        if product is None:
            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

    for key, value in image_data.model_dump(exclude_unset=True).items():
        setattr(image, key, value)

    return image_repository.update(db, image)

def delete_image(db:Session, image_id:int):
    image = image_repository.get_by_id(db, image_id)

    if image is None:
        raise HTTPException(
            status_code=404,
            detail="Image not found"
        )

    deleted = image_repository.delete(db, image)
    delete_media_file(deleted.url)
    return deleted

def upload_images(db: Session, product_id: int, files: list[bytes], alt: str | None = None):
    product = product_repository.get_by_id(db, product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if not files:
        raise HTTPException(
            status_code=422,
            detail="No files uploaded"
        )

    # Se comprimen todas antes de tocar la base: si una falla no queda nada a medias.
    urls = []
    try:
        for data in files:
            urls.append(save_product_image(data))
    except HTTPException:
        for url in urls:
            delete_media_file(url)
        raise

    next_order = image_repository.get_next_order(db, product_id)
    label = alt.strip() if alt and alt.strip() else product.name

    new_images = [
        Image(
            product_id=product_id,
            url=url,
            alt=label,
            order=next_order + index,
            is_active=True
        )
        for index, url in enumerate(urls)
    ]

    return image_repository.create_many(db, new_images)