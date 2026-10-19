"""Add sale units (unit / box / m2) to products

Revision ID: b7c1e2d3f4a5
Revises: 956aa4ce7463
Create Date: 2026-10-19 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c1e2d3f4a5'
down_revision: Union[str, Sequence[str], None] = '956aa4ce7463'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('products', sa.Column('price_unit', sa.String(), nullable=False, server_default='unit'))
    op.add_column('products', sa.Column('stock_unit', sa.String(), nullable=False, server_default='unit'))
    op.add_column('products', sa.Column('m2_per_box', sa.Float(), nullable=True))
    # Los m² se venden con decimales (ej. 1,44 m² por caja).
    op.alter_column('products', 'stock', type_=sa.Float(), existing_type=sa.Integer(), existing_nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        'products', 'stock',
        type_=sa.Integer(), existing_type=sa.Float(), existing_nullable=False,
        postgresql_using='round(stock)::integer',
    )
    op.drop_column('products', 'm2_per_box')
    op.drop_column('products', 'stock_unit')
    op.drop_column('products', 'price_unit')
