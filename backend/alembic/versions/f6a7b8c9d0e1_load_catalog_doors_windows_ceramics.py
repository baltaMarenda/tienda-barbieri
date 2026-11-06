"""Load catalog: doors, windows and ceramics (sin stock cargado)

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-11-06 12:30:00.000000

Carga de datos: reutiliza las categorías si ya existen (mismo nombre, sin
importar tildes ni mayúsculas) y no duplica productos con el mismo nombre.
"""
import unicodedata
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f6a7b8c9d0e1'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PAVIR = "Chapa galvanizada, pintura al horno, triple contacto."
SELECTA = "Foliada en PVC. Contramarco regulable."

# (nombre, precio, descripción) — precio por unidad.
DOORS = [
    ("Puerta Pavir Verona Luján 80x200 Blanca", 460000, PAVIR),
    ("Puerta Pavir Verona Luján 80x200 Grafito", 460000, PAVIR),
    ("Puerta Pavir Florencia ciega 80x200", 325000, PAVIR),
    ("Puerta Pavir Florencia 1/2 reja 80x200", 378000, PAVIR),

    ("Puerta Barmetal M330 80x200", 195000, None),
    ("Puerta Barmetal M330 Blanca 80x200", 295000, None),
    ("Puerta Barmetal M700 80x200", 308000, None),
    ("Puerta Barmetal M830 70x200", 280000, None),
    ("Puerta Barmetal M830 80x200", 280000, None),
    ("Puerta Barmetal M810 70x200", 310000, None),
    ("Puerta Barmetal M810 80x200", 310000, None),
    ("Puerta Barmetal M1830 Blanca", 385000, None),
    ("Puerta Barmetal M1830 Negra", 385000, None),
    ("Puerta Barmetal M1810 Blanca", 515000, None),
    ("Puerta Barmetal M1810 Negra", 515000, None),

    ("Puerta hoja pino marco álamo 60x10", 97000, None),
    ("Puerta hoja pino marco álamo 70x10", 97000, None),
    ("Puerta hoja pino marco álamo 80x10", 100000, None),
    ("Puerta hoja pino marco álamo 60x15", 108000, None),
    ("Puerta hoja pino marco álamo 70x15", 108000, None),
    ("Puerta hoja pino marco álamo 80x15", 112000, None),

    ("Puerta hoja pino marco chapa 24 70x15", 125000, None),
    ("Puerta hoja pino marco chapa 24 80x15", 135000, None),

    ("Puerta hoja pino económica 70x10 marco de madera", 85000, None),
    ("Puerta hoja pino económica 80x15 marco de aluminio", 95000, None),

    ("Puerta Gromanti hoja cedro marco de pino 70x15", 240000, None),
    ("Puerta Gromanti hoja cedro marco de pino 80x15", 265000, None),
    ("Puerta Gromanti Línea Masonite 70x15", 240000, None),
    ("Puerta Gromanti Línea Masonite 80x15", 265000, None),
    ("Puerta Gromanti Línea Selecta 70x15", 317000, SELECTA),
    ("Puerta Gromanti Línea Selecta 80x15", 325000, SELECTA),

    ("Puerta de embutir hoja pino marco de chapa 60x15", 255000, None),
    ("Puerta de embutir hoja pino marco de chapa 70x15", 255000, None),
    ("Puerta de embutir hoja pino marco de chapa 80x15", 277000, None),
    ("Puerta de embutir hoja cedro marco de chapa 60x15", 385000, None),
    ("Puerta de embutir hoja cedro marco de chapa 70x15", 400000, None),
    ("Puerta de embutir hoja cedro marco de chapa 80x15", 450000, None),
    ("Puerta de embutir hoja cedro marco de pino 60x15", 527000, None),
    ("Puerta de embutir hoja cedro marco de pino 70x15", 535000, None),
    ("Puerta de embutir hoja cedro marco de pino 80x15", 575000, None),

    ("Puerta aluminio blanco 36 mm liviana 80x200 1/4 vidrio", 290000, None),
    ("Puerta aluminio blanco 36 mm liviana 80x200 1/2 vidrio", 290000, None),
    ("Puerta aluminio blanco 36 mm liviana 80x200 vidrio lateral", 315000, None),
    ("Puerta aluminio blanco 36 mm liviana 80x200 todo vidrio", 248000, None),
]

WINDOWS = [
    ("Ventana aluminio blanco Línea Herrero 60x40", 70000, None),
    ("Ventana aluminio blanco Línea Herrero 120x110", 145000, None),
    ("Ventana aluminio blanco Línea Herrero 150x110", 155000, None),
    ("Ventana aluminio blanco Línea Herrero 150x150", 185000, None),
    ("Ventana aluminio blanco Línea Herrero 120x200", 220000, None),
    ("Ventana aluminio blanco Línea Herrero 150x200", 245000, None),
    ("Ventana Línea económica aluminio natural con reja 120x110", 126000, None),
    ("Ventana Línea económica aluminio natural con reja 150x110", 145000, None),
]

# (línea, medida, m² por caja, [(modelo, precio por m²)])
CERAMICS = [
    ("Cortines", "50x50", 2.25, [
        ("Castaño", 9900),
        ("Álamo", 9900),
        ("Cotto", 12200),
        ("Sierra beige", 9900),
        ("Sierra gris", 9900),
        ("Calacata", 11500),
        ("Paladio 2da", 8000),
        ("Zicornio 2da", 8000),
        ("Toledo negro", 11500),
        ("Toledo gris", 11500),
        ("Pórfido", 11500),
        ("Granada gris", 11500),
        ("Granada beige", 11500),
    ]),
    ("Cortines", "60x60", 2.16, [
        ("Statuario blanco", 11100),
        ("Aspen gris", 11250),
        ("Aspen beige", 11250),
        ("Roma beige", 12000),
        ("Roma grigio", 12000),
        ("Portland grey", 12670),
        ("Portland steel", 12670),
        ("Portland grey 2da", 8500),
        ("Portland sand 2da", 8500),
        ("Brescia chiaro 2da", 8500),
        ("Terraza marfil", 12670),
        ("Lumina gold", 12670),
        ("Basalto gris", 13440),
    ]),
    ("Cortines", "30x60", 1.67, [
        ("Paladio 2da", 8500),
        ("Fresno", 10200),
        ("Teca", 10200),
        ("Abedul", 10200),
        ("Statuario blanco", 10200),
        ("Murete tiza", 10400),
        ("Murete crayón", 10400),
        ("Pizarra", 10400),
        ("Basalto gris", 13440),
        ("Basalto acero", 13440),
    ]),
    ("San Lorenzo", "33x33", 2.06, [
        ("Aquamix blue", 13500),
        ("Aquamix humo", 13500),
        ("Aquamix plata", 13500),
        ("Aquamix blue 2da", 9500),
        ("Blanco forte 2da", 8600),
    ]),
    ("San Lorenzo", "33x45", 2.26, [
        ("Tuil blanco", 10150),
    ]),
]


def _rows():
    """(categoría, dict de producto) para cada producto a cargar."""
    for name, price, description in DOORS:
        yield "Puertas", dict(name=name, description=description, price=price,
                              price_unit="unit", stock_unit="unit", m2_per_box=None)
    for name, price, description in WINDOWS:
        yield "Ventanas", dict(name=name, description=description, price=price,
                               price_unit="unit", stock_unit="unit", m2_per_box=None)
    for line, size, m2_per_box, models in CERAMICS:
        for model, price in models:
            yield "Cerámicos", dict(
                name=f"Cerámico {line} {model} {size}",
                description=None,
                price=price,
                price_unit="m2",
                stock_unit="m2",
                m2_per_box=m2_per_box,
            )


def _normalize(text: str) -> str:
    text = unicodedata.normalize("NFD", text)
    return "".join(c for c in text if unicodedata.category(c) != "Mn").strip().lower()


categories = sa.table(
    "categories",
    sa.column("id", sa.Integer),
    sa.column("name", sa.String),
)
products = sa.table(
    "products",
    sa.column("id", sa.Integer),
    sa.column("name", sa.String),
    sa.column("description", sa.String),
    sa.column("price", sa.Float),
    sa.column("price_unit", sa.String),
    sa.column("stock", sa.Float),
    sa.column("stock_unit", sa.String),
    sa.column("m2_per_box", sa.Float),
    sa.column("category_id", sa.Integer),
)


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()

    category_ids = {
        _normalize(name): id_
        for id_, name in bind.execute(sa.select(categories.c.id, categories.c.name))
    }
    existing_products = {
        _normalize(name) for (name,) in bind.execute(sa.select(products.c.name))
    }

    for category_name, product in _rows():
        key = _normalize(category_name)
        if key not in category_ids:
            category_ids[key] = bind.execute(
                categories.insert().values(name=category_name).returning(categories.c.id)
            ).scalar_one()

        if _normalize(product["name"]) in existing_products:
            continue

        # Sin stock cargado (NULL): se vende sin tope.
        bind.execute(products.insert().values(
            **product, stock=None, category_id=category_ids[key],
        ))
        existing_products.add(_normalize(product["name"]))


def downgrade() -> None:
    """Downgrade schema."""
    # Sólo se borran los productos de esta carga (se crearon sin stock, y antes
    # de esta versión el stock era obligatorio); las categorías quedan.
    names = [product["name"] for _, product in _rows()]
    op.get_bind().execute(
        products.delete().where(products.c.name.in_(names), products.c.stock.is_(None))
    )
