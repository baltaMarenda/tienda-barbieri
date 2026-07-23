from sqlalchemy import Integer, Column, String, Float
from app.db.database import Base
from pydantic import BaseModel
from sqlalchemy.orm import relationship

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    products = relationship(
        "Product", 
        back_populates="category"
        )


class CategoryCreate(BaseModel):
    name:str
    
class CategoryResponse(CategoryCreate):
    id: int

    class Config: 
        from_attributes = True