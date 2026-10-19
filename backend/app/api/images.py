from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.schemas.image import ImageCreate, ImageResponse, ImageUpdate
from app.services import image_service
from app.models.user import User
from app.core.auth import get_current_admin

router = APIRouter(prefix="/images", tags=["Images"])

@router.post("/", response_model=ImageResponse)
async def create_images(image: ImageCreate, db:Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return image_service.create_image(db, image)

# Sync a propósito: la compresión con Pillow corre en el threadpool de FastAPI
# y no bloquea el event loop.
@router.post("/upload", response_model=list[ImageResponse])
def upload_images(
    product_id: int = Form(gt=0),
    files: list[UploadFile] = File(),
    alt: str | None = Form(default=None),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin),
):
    contents = [file.file.read() for file in files]
    return image_service.upload_images(db, product_id, contents, alt)

@router.get("/", response_model=list[ImageResponse])
async def get_images(db:Session = Depends(get_db)):
    return image_service.get_all_images(db)

@router.get("/{id}", response_model=ImageResponse)
async def get_image_by_id(id:int, db:Session = Depends(get_db)):
    return image_service.get_image_by_id(db,id)

@router.put("/{id}", response_model=ImageResponse)
async def update(id: int, image: ImageUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return image_service.update_image(db, id, image)

@router.delete("/{id}", response_model=ImageResponse)
async def delete(id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return image_service.delete_image(db, id)
  