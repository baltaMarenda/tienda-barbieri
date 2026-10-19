"""
Guardado de imágenes subidas desde el panel admin.

Cada archivo se recomprime a WebP y se achica a un lado máximo de
MAX_IMAGE_SIDE px. Si está CLOUDINARY_URL se sube a Cloudinary (producción:
el disco de Render se borra en cada deploy); si no, se escribe en MEDIA_DIR,
que la app sirve como archivos estáticos bajo MEDIA_URL_PREFIX.
"""
import re
from io import BytesIO
from os import getenv
from pathlib import Path
from uuid import uuid4

import cloudinary
import cloudinary.uploader
from cloudinary.exceptions import Error as CloudinaryError
from dotenv import load_dotenv
from fastapi import HTTPException
from PIL import Image as PILImage, ImageOps, UnidentifiedImageError

load_dotenv()

USE_CLOUDINARY = bool(getenv("CLOUDINARY_URL"))
CLOUDINARY_FOLDER = getenv("CLOUDINARY_FOLDER") or "tienda-barbieri/products"

if USE_CLOUDINARY:
    # El SDK lee CLOUDINARY_URL al importarse, antes de que load_dotenv corra.
    cloudinary.reset_config()
    cloudinary.config(secure=True)

MEDIA_DIR = Path(getenv("MEDIA_DIR") or Path(__file__).resolve().parents[2] / "media")
MEDIA_URL_PREFIX = "/media"
PRODUCT_IMAGES_SUBDIR = "products"

MAX_UPLOAD_BYTES = 15 * 1024 * 1024
MAX_IMAGE_SIDE = 1600
WEBP_QUALITY = 80


def ensure_media_dir():
    (MEDIA_DIR / PRODUCT_IMAGES_SUBDIR).mkdir(parents=True, exist_ok=True)


def save_product_image(data: bytes) -> str:
    """Comprime la imagen y devuelve la URL relativa con la que se sirve."""
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Image too large (max 15 MB)"
        )

    try:
        with PILImage.open(BytesIO(data)) as source:
            # Respeta la rotación que guardan las fotos de celular en el EXIF.
            image = ImageOps.exif_transpose(source)
            image.thumbnail((MAX_IMAGE_SIDE, MAX_IMAGE_SIDE))

            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGBA" if "transparency" in image.info else "RGB")

            output = BytesIO()
            image.save(output, format="WEBP", quality=WEBP_QUALITY, method=6)
    except (UnidentifiedImageError, OSError, PILImage.DecompressionBombError):
        raise HTTPException(
            status_code=422,
            detail="File is not a valid image"
        )

    if USE_CLOUDINARY:
        return _upload_to_cloudinary(output)

    ensure_media_dir()
    filename = f"{uuid4().hex}.webp"
    (MEDIA_DIR / PRODUCT_IMAGES_SUBDIR / filename).write_bytes(output.getvalue())

    return f"{MEDIA_URL_PREFIX}/{PRODUCT_IMAGES_SUBDIR}/{filename}"


def _upload_to_cloudinary(output: BytesIO) -> str:
    output.seek(0)
    try:
        result = cloudinary.uploader.upload(
            output,
            folder=CLOUDINARY_FOLDER,
            public_id=uuid4().hex,
            resource_type="image",
            overwrite=False,
        )
    except CloudinaryError:
        raise HTTPException(
            status_code=502,
            detail="Could not upload image"
        )

    return result["secure_url"]


def _cloudinary_public_id(url: str) -> str | None:
    """Saca el public_id de una URL de nuestra cuenta y carpeta; None si es ajena."""
    cloud_name = cloudinary.config().cloud_name
    prefix = f"https://res.cloudinary.com/{cloud_name}/image/upload/"
    if not url.startswith(prefix):
        return None

    path = re.sub(r"^v\d+/", "", url.removeprefix(prefix))
    public_id = path.rsplit(".", 1)[0]
    return public_id if public_id.startswith(f"{CLOUDINARY_FOLDER}/") else None


def delete_media_file(url: str):
    """Borra el archivo si la URL apunta a un upload propio; ignora links externos."""
    if USE_CLOUDINARY:
        public_id = _cloudinary_public_id(url)
        if public_id is not None:
            try:
                cloudinary.uploader.destroy(public_id, resource_type="image", invalidate=True)
            except CloudinaryError:
                # La fila ya se borró; un archivo huérfano en Cloudinary no rompe nada.
                pass
            return

    prefix = f"{MEDIA_URL_PREFIX}/"
    if not url.startswith(prefix):
        return

    path = (MEDIA_DIR / url.removeprefix(prefix)).resolve()
    if MEDIA_DIR.resolve() in path.parents:
        path.unlink(missing_ok=True)
