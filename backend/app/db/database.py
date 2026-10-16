from os import getenv
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# La app usa la conexión pooled de Neon; si no está, cae a la directa.
DATABASE_URL = getenv("DATABASE_URL_POOLED") or getenv("DATABASE_URL")

# pool_pre_ping: Neon suspende la compute cuando está inactiva y corta conexiones.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
