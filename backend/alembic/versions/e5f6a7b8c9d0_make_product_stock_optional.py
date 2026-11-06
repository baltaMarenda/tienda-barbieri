"""Make product stock optional

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-11-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # NULL = sin stock cargado: el producto se vende sin tope.
    op.alter_column('products', 'stock', existing_type=sa.Float(), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.execute("UPDATE products SET stock = 0 WHERE stock IS NULL")
    op.alter_column('products', 'stock', existing_type=sa.Float(), nullable=False)
