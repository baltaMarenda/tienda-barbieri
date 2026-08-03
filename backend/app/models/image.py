from sqlalchemy import Integer, Column, String, Boolean, ForeignKey
from app.db.database import Base
from sqlalchemy.orm import relationship

class Image(Base):
    __tablename__ = "images"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column (
        Integer,
        ForeignKey("products.id"),
        nullable=False
    )
    url = Column(String, nullable=False)
    alt = Column(String, nullable=False)
    order = Column (Integer, nullable=False)
    is_active = Column(Boolean, nullable=False)
    product = relationship(
        "Product",
        back_populates="images"
    )




