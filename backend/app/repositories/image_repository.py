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