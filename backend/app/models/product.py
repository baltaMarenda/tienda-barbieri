from sqlalchemy import Integer, Column, String, Float, ForeignKey
from app.db.database import Base
from pydantic import BaseModel
from sqlalchemy.orm import relationship

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False)
    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False
    )
    category = relationship(
        "Category",
        back_populates="products"
    )

class ProductCreate(BaseModel):
    name:str
    category: str
    description: str | None = None
    price:float
    stock:int
    category_id:int

class ProductResponse(ProductCreate):
    id: int

    class Config: 
        from_attributes = True
        
    

