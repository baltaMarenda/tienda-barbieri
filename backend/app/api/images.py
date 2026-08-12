from fastapi import APIRouter, Depends
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
  