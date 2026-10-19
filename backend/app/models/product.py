from sqlalchemy import Integer, Column, String, Float, ForeignKey
from app.db.database import Base
from sqlalchemy.orm import relationship

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    # Unidad en la que se expresa el precio y el stock: "unit", "box" o "m2".
    # Los rubros cerámicos usan caja o metro cuadrado; el resto, unidad.
    price_unit = Column(String, nullable=False, default="unit", server_default="unit")
    stock = Column(Float, nullable=False)
    stock_unit = Column(String, nullable=False, default="unit", server_default="unit")
    # Metros cuadrados que trae cada caja: permite convertir entre caja y m².
    m2_per_box = Column(Float, nullable=True)
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
