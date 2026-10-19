from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.image import Image

def create(db:Session, image:Image):
    db.add(image)
    db.commit()
    db.refresh(image)

    return image

def get_all(db:Session):
    return db.query(Image).all()

def get_by_id(db:Session, image_id:int):
    return db.query(Image).filter_by(id = image_id).first()

def update(db: Session, image: Image):
    db.commit()
    db.refresh(image)
    return image

def delete(db: Session, image: Image):
    db.delete(image)
    db.commit()
    return image

def create_many(db: Session, images: list[Image]):
    db.add_all(images)
    db.commit()
    for image in images:
        db.refresh(image)

    return images

def get_next_order(db: Session, product_id: int) -> int:
    current = db.query(func.max(Image.order)).filter_by(product_id=product_id).scalar()
    return 0 if current is None else current + 1
