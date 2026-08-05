from sqlalchemy import Integer, Column, String, Float, ForeignKey
from app.db.database import Base
from sqlalchemy.orm import relationship

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
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
    images = relationship(
        "Image",
        back_populates="product",
        cascade="all, delete-orphan"
    )
