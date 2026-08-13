/**
 * Tipos espejo de los schemas Pydantic del backend (backend/app/schemas/).
 * Si cambia un schema allá, este archivo es el único lugar a tocar acá.
 */

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
  price: number;
  stock: number;
}

export interface ProductListResponse {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  alt: string;
  order: number;
  is_active: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/** Valores aceptados por el query param `sort` de GET /products/. */
export type ProductSort = "price_asc" | "price_desc";

export interface ProductQuery {
  page?: number;
  limit?: number;
  sort?: ProductSort | null;
  category_id?: number | null;
  search?: string | null;
}

export interface ProductPayload {
  name: string;
  description: string | null;
  category_id: number;
  price: number;
  stock: number;
}

export interface ImagePayload {
  product_id: number;
  url: string;
  alt: string;
  order: number;
  is_active: boolean;
}

/** Línea del carrito local (no existe endpoint de pedidos en el backend). */
export interface CartLine {
  productId: number;
  name: string;
  price: number;
  stock: number;
  imageUrl: string | null;
  quantity: number;
}
