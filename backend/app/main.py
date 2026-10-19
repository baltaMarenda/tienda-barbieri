from os import getenv

from dotenv import load_dotenv
from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.db.database import engine, Base

from app.api.products import router as product_router
from app.api.categories import router as category_router
from app.api.images import router as image_router
from app.api.user import router as user_router
from app.api.auth import router as auth_router
from app.core.media import MEDIA_DIR, MEDIA_URL_PREFIX, ensure_media_dir

Base.metadata.create_all(bind=engine)

load_dotenv()

# Orígenes del front separados por coma, ej: "https://tienda.onrender.com,http://localhost:5173".
CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in (getenv("CORS_ORIGINS") or "http://localhost:5173").split(",")
    if origin.strip()
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {'message':'hola'}

@app.get("/test-db")
def test_db():
    try:
        with engine.connect() as connection:
            return {
                "database": "conectada"
            }
    except Exception as e:
        return {
            "error": str(e)
        }
    
app.include_router(product_router)
app.include_router(category_router)
app.include_router(image_router)
app.include_router(user_router)
app.include_router(auth_router)

# Imágenes subidas desde el panel admin (ver app/core/media.py).
ensure_media_dir()
app.mount(MEDIA_URL_PREFIX, StaticFiles(directory=MEDIA_DIR), name="media")