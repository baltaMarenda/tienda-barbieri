from sqlalchemy.orm import Session
from app.models.category import Category

def create(db:Session, category:Category):
    db.add(category)
    db.commit()
    db.refresh(category)

    return category

def get_all(db:Session):
    return db.query(Category).all()

def get_by_id(db:Session, category_id:int):
    return db.query(Category).filter_by(id = category_id).first()

def update(db: Session, category: Category):
    db.commit()
    db.refresh(category)
    return category

def delete(db: Session, category: Category):
    db.delete(category)
    db.commit()
    return category
