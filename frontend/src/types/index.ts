/**
 * Tipos espejo de los schemas Pydantic del backend (backend/app/schemas/).
 * Si cambia un schema allá, este archivo es el único lugar a tocar acá.
 */

export interface Category {
  id: number;
  name: string;
}

/**
 * Unidad de venta: "unit" (unidad), "box" (caja) o "m2" (metro cuadrado).
 * Caja y m² se usan sólo en rubros cerámicos (ver lib/units.ts).
 */
export type SaleUnit = "unit" | "box" | "m2";

export interface Product {
  id: number;
  name: string;
  description: string | null;
  category_id: number;
  price: number;
  price_unit: SaleUnit;
  /** Puede tener decimales cuando se mide en m². */
  stock: number;
  stock_unit: SaleUnit;
  /** m² que trae cada caja; permite convertir entre caja y m². */
  m2_per_box: number | null;
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
  price_unit: SaleUnit;
  stock: number;
  stock_unit: SaleUnit;
  m2_per_box: number | null;
}

export interface ImagePayload {
  product_id: number;
  url: string;
  alt: string;
  order: number;
  is_active: boolean;
}

/** Línea del carrito local; al confirmar se envía como `OrderPayload.items`. */
export interface CartLine {
  productId: number;
  name: string;
  /** Precio por `unit` (ver `saleTerms` en lib/units.ts). */
  price: number;
  /** Disponible, expresado en `unit`. */
  stock: number;
  unit: SaleUnit;
  imageUrl: string | null;
  quantity: number;
}

/* --- Pedidos ------------------------------------------------------------------ */

export type PaymentMethod = "cash" | "transfer" | "card";
export type ShippingMethod = "pickup" | "delivery";
export type OrderStatus = "received" | "delivered";

export interface OrderItem {
  id: number;
  /** null si el producto se borró después de hacer el pedido. */
  product_id: number | null;
  product_name: string;
  unit: SaleUnit;
  unit_price: number;
  quantity: number;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  payment_method: PaymentMethod;
  shipping_method: ShippingMethod;
  shipping_address: string | null;
  notes: string | null;
  total: number;
  status: OrderStatus;
  /** UTC sin zona horaria (ver `parseServerDate` en lib/orders.ts). */
  created_at: string;
  items: OrderItem[];
}

export interface OrderListResponse {
  items: Order[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface OrderPayload {
  customer_name: string;
  customer_phone: string;
  payment_method: PaymentMethod;
  shipping_method: ShippingMethod;
  shipping_address: string | null;
  notes: string | null;
  items: { product_id: number; quantity: number }[];
}
