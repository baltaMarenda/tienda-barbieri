import { request } from "./client";
import type { ImagePayload, ProductImage } from "../types";

/**
 * El backend no incluye las imágenes dentro de ProductResponse y `GET /images/`
 * no acepta filtro por producto, así que la única forma de resolver la galería
 * es traer el listado completo una vez y agruparlo en memoria. La promesa se
 * cachea para que una grilla de 12 tarjetas no dispare 12 requests iguales.
 */
let imagesCache: Promise<ProductImage[]> | null = null;

/**
 * Sin AbortSignal, por el mismo motivo que `getCategories`: la promesa se
 * comparte entre consumidores y el aborto de uno cancelaría el de todos.
 */
export function getAllImages(): Promise<ProductImage[]> {
  if (!imagesCache) {
    imagesCache = request<ProductImage[]>("/images/").catch((error) => {
      imagesCache = null; // un fallo no debe quedar cacheado para siempre
      throw error;
    });
  }
  return imagesCache;
}

/** Invalidar después de cualquier alta/edición/baja desde el panel admin. */
export function invalidateImagesCache(): void {
  imagesCache = null;
}

/** Agrupa por producto, descarta inactivas y ordena por el campo `order`. */
export function groupActiveImages(
  images: ProductImage[],
): Map<number, ProductImage[]> {
  const grouped = new Map<number, ProductImage[]>();

  for (const image of images) {
    if (!image.is_active) continue;
    const list = grouped.get(image.product_id);
    if (list) list.push(image);
    else grouped.set(image.product_id, [image]);
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  return grouped;
}

export function createImage(payload: ImagePayload): Promise<ProductImage> {
  invalidateImagesCache();
  return request<ProductImage>("/images/", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

/**
 * Sube archivos de imagen para un producto. El backend los comprime a WebP,
 * los guarda y los agrega al final de la galería, activos y con `alt` igual al
 * nombre del producto si no se indica otro.
 */
export function uploadImages(
  productId: number,
  files: File[],
  alt?: string,
): Promise<ProductImage[]> {
  invalidateImagesCache();

  const form = new FormData();
  form.append("product_id", String(productId));
  for (const file of files) form.append("files", file);
  if (alt) form.append("alt", alt);

  return request<ProductImage[]>("/images/upload", {
    method: "POST",
    body: form,
    auth: true,
  });
}

/**
 * `product_id` va siempre, incluso si no cambió: el servicio del backend hace
 * `product_repository.get_by_id(db, image_data.product_id)` sin chequear None y
 * responde 404 "Product not found" si el campo viene ausente.
 */
export function updateImage(
  id: number,
  payload: ImagePayload,
): Promise<ProductImage> {
  invalidateImagesCache();
  return request<ProductImage>(`/images/${id}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export function deleteImage(id: number): Promise<ProductImage> {
  invalidateImagesCache();
  return request<ProductImage>(`/images/${id}`, { method: "DELETE", auth: true });
}
