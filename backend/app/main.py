from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.db.database import engine
from app.db.database import engine, Base
from app.models.product import Product
from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse
from app.api.products import router as product_router
from app.api.categories import router as category_router

Base.metadata.create_all(bind=engine)

app = FastAPI()

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