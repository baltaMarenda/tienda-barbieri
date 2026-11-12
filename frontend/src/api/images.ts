import { request } from "./client";
import type { ImagePayload, Product, ProductImage } from "../types";

/**
 * Listado completo de imágenes: sólo lo usa el panel admin. La tienda lee la
 * galería de `product.images`, que viene dentro de cada producto. La promesa se
 * cachea para no repetir el pedido entre pantallas del panel.
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

/** Imágenes visibles de un producto, en el orden de la galería. */
export function activeImages(product: Product | null | undefined): ProductImage[] {
  return (product?.images ?? [])
    .filter((image) => image.is_active)
    .sort((a, b) => a.order - b.order);
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
