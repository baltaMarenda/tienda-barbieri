import { request } from "./client";
import type { Category } from "../types";

/**
 * Las categorías alimentan el header, los filtros del catálogo y el nombre de
 * rubro de cada tarjeta. Se cachea la promesa para no repetir el mismo GET en
 * cada componente que las necesita.
 *
 * A propósito NO recibe un AbortSignal: la promesa es compartida, así que si un
 * consumidor abortara (por ejemplo el cleanup del efecto que React ejecuta dos
 * veces en StrictMode) rompería el pedido para todos los demás. Cada hook
 * descarta su propio resultado tardío con un flag `active`.
 */
let categoriesCache: Promise<Category[]> | null = null;

export function getCategories(): Promise<Category[]> {
  if (!categoriesCache) {
    categoriesCache = request<Category[]>("/categories/").catch((error) => {
      categoriesCache = null;
      throw error;
    });
  }
  return categoriesCache;
}

export function invalidateCategoriesCache(): void {
  categoriesCache = null;
}

export function createCategory(name: string): Promise<Category> {
  invalidateCategoriesCache();
  return request<Category>("/categories/", {
    method: "POST",
    body: { name },
    auth: true,
  });
}

export function updateCategory(id: number, name: string): Promise<Category> {
  invalidateCategoriesCache();
  return request<Category>(`/categories/${id}`, {
    method: "PUT",
    body: { name },
    auth: true,
  });
}

export function deleteCategory(id: number): Promise<Category> {
  invalidateCategoriesCache();
  return request<Category>(`/categories/${id}`, { method: "DELETE", auth: true });
}
