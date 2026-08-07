from fastapi import FastAPI
from app.db.database import engine, Base
from app.api.products import router as product_router
from app.api.categories import router as category_router
from app.api.images import router as image_router
from app.api.user import router as user_router
from app.api.auth import router as auth_router

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
app.include_router(image_router)
app.include_router(user_router)
app.include_router(auth_router)