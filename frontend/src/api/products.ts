import { buildQuery, request } from "./client";
import type {
  Product,
  ProductListResponse,
  ProductPayload,
  ProductQuery,
} from "../types";

export function getProducts(
  query: ProductQuery = {},
  signal?: AbortSignal,
): Promise<ProductListResponse> {
  const qs = buildQuery({
    page: query.page ?? 1,
    limit: query.limit ?? 12,
    sort: query.sort,
    category_id: query.category_id,
    search: query.search,
  });

  return request<ProductListResponse>(`/products/${qs}`, { signal });
}

export function getProduct(id: number, signal?: AbortSignal): Promise<Product> {
  return request<Product>(`/products/${id}`, { signal });
}

/**
 * Catálogo completo, recorriendo la paginación. El endpoint topea `limit` en
 * 100, así que se piden páginas hasta agotar. Se usa sólo en el panel admin,
 * donde hace falta el listado entero para los selectores.
 */
export async function getAllProducts(signal?: AbortSignal): Promise<Product[]> {
  const first = await getProducts({ page: 1, limit: 100 }, signal);
  const items = [...first.items];

  for (let page = 2; page <= first.pages; page++) {
    const next = await getProducts({ page, limit: 100 }, signal);
    items.push(...next.items);
  }

  return items;
}

export function createProduct(payload: ProductPayload): Promise<Product> {
  return request<Product>("/products/", { method: "POST", body: payload, auth: true });
}

export function updateProduct(
  id: number,
  payload: Partial<ProductPayload>,
): Promise<Product> {
  return request<Product>(`/products/${id}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export function deleteProduct(id: number): Promise<Product> {
  return request<Product>(`/products/${id}`, { method: "DELETE", auth: true });
}
