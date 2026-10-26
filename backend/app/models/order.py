from datetime import datetime, timezone

from sqlalchemy import Integer, Column, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship

from app.db.database import Base


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    # Localidad o barrio del cliente; orienta la zona de envío.
    customer_locality = Column(String, nullable=True)
    # "cash" (efectivo), "transfer" (transferencia) o "card" (tarjeta).
    payment_method = Column(String, nullable=False)
    # "pickup" (retiro en el local) o "delivery" (envío a domicilio).
    shipping_method = Column(String, nullable=False)
    # Sólo se completa cuando el envío es a domicilio.
    shipping_address = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    # Se calcula en el backend con los precios vigentes al crear el pedido.
    total = Column(Float, nullable=False)
    # "received" (recibido) o "delivered" (entregado).
    status = Column(String, nullable=False, default="received", server_default="received")
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderItem.id"
    )


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False
    )
    # Si después se borra el producto, el pedido conserva nombre y precio.
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="SET NULL"),
        nullable=True
    )
    product_name = Column(String, nullable=False)
    unit = Column(String, nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    order = relationship(
        "Order",
        back_populates="items"
    )
