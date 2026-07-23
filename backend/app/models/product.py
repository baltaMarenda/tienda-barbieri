from sqlalchemy import Integer, Column, String, Float
from app.db.database import Base
from pydantic import BaseModel

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False)

class ProductCreate(BaseModel):
    name:str
    category: str
    description: str | None = None
    price:float
    stock:int

class ProductResponse(ProductCreate):
    id: int

    class Config: 
        from_attributes = True
        
    

