"""Add indexes on products.category_id and images.product_id

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-11-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a7b8c9d0e1f2'
down_revision: Union[str, Sequence[str], None] = 'f6a7b8c9d0e1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Filtro por rubro en el catálogo y carga de la galería de cada producto.
    op.create_index(op.f('ix_products_category_id'), 'products', ['category_id'], unique=False)
    op.create_index(op.f('ix_images_product_id'), 'images', ['product_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_images_product_id'), table_name='images')
    op.drop_index(op.f('ix_products_category_id'), table_name='products')
