import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { ProductCard } from "../components/product/ProductCard";
import { Alert, EmptyState, ProductGridSkeleton } from "../components/ui/Feedback";
import { Icon } from "../components/ui/Icon";
import { Pagination } from "../components/ui/Pagination";
import { SearchInput } from "../components/ui/SearchInput";
import { useCategories } from "../hooks/useCategories";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useProductImages } from "../hooks/useProductImages";
import { useProducts } from "../hooks/useProducts";
import { formatNumber, plural } from "../lib/format";
import type { ProductSort } from "../types";

const PAGE_SIZE = 12;

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Orden por defecto" },
  { value: "price_asc", label: "Precio: de menor a mayor" },
  { value: "price_desc", label: "Precio: de mayor a menor" },
];

function parseSort(value: string | null): ProductSort | null {
  return value === "price_asc" || value === "price_desc" ? value : null;
}

export function Catalog() {
  /* Todo el estado del catálogo vive en la URL: los filtros se comparten,
     se guardan en favoritos y el botón Atrás del navegador funciona. */
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get("search") ?? "";
  const categoryParam = searchParams.get("category");
  const categoryId = categoryParam ? Number(categoryParam) : null;
  const sort = parseSort(searchParams.get("sort"));
  const page = Math.max(Number(searchParams.get("page") ?? 1) || 1, 1);

  const { categories, categoryById } = useCategories();
  const imagesByProduct = useProductImages();

  const [term, setTerm] = useState(urlSearch);
  const [syncedSearch, setSyncedSearch] = useState(urlSearch);
  const debouncedTerm = useDebouncedValue(term, 350);

  const updateParams = useCallback(
    (changes: Record<string, string | null>, resetPage = true) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === "") next.delete(key);
            else next.set(key, value);
          }
          if (resetPage) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /* Lo tipeado llega a la URL recién cuando el usuario deja de escribir. */
  useEffect(() => {
    if (debouncedTerm.trim() === urlSearch) return;
    updateParams({ search: debouncedTerm.trim() || null });
  }, [debouncedTerm, urlSearch, updateParams]);

  /* Si la URL cambia desde afuera (buscador del header, botón Atrás) el input
     se pone al día. Es un ajuste durante el render, no un efecto: así no hay
     render en cascada. La comparación contra `debouncedTerm` evita pisar lo que
     el usuario siguió tipeando mientras se aplicaba la búsqueda anterior. */
  if (urlSearch !== syncedSearch) {
    setSyncedSearch(urlSearch);
    if (urlSearch !== debouncedTerm.trim()) setTerm(urlSearch);
  }

  const { data, loading, error, reload } = useProducts({
    page,
    limit: PAGE_SIZE,
    sort,
    category_id: categoryId,
    search: urlSearch || null,
  });

  const products = data?.items ?? [];
  const total = data?.total ?? 0;
  const activeCategory = categoryId ? categoryById.get(categoryId) : undefined;
  const hasFilters = Boolean(urlSearch || categoryId || sort);

  return (
    <div className="bb-container bb-section">
      <div style={{ marginBottom: "var(--space-6)" }}>
        <span className="bb-rule" style={{ display: "block", marginBottom: "var(--space-3)" }} />
        <h1>{activeCategory ? activeCategory.name : "Catálogo completo"}</h1>
        <p className="bb-lead">
          Materiales de construcción, aberturas y remodelación con stock y precio en
          línea.
        </p>
      </div>

      <div className="bb-catalog">
        {/* --- Filtros ------------------------------------------------------- */}
        <aside className="bb-filters" aria-label="Filtros del catálogo">
          <div>
            <h2 className="bb-filters__group-title">Buscar</h2>
            <SearchInput
              value={term}
              onChange={setTerm}
              label="Buscar productos por nombre"
              placeholder="Nombre del producto…"
            />
          </div>

          <div>
            <h2 className="bb-filters__group-title">Rubros</h2>
            <div className="bb-filters__list">
              <button
                type="button"
                className="bb-filters__option"
                aria-pressed={!categoryId}
                onClick={() => updateParams({ category: null })}
              >
                Todos los rubros
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="bb-filters__option"
                  aria-pressed={categoryId === category.id}
                  onClick={() => updateParams({ category: String(category.id) })}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {hasFilters ? (
            <button
              type="button"
              className="bb-btn bb-btn--secondary bb-btn--sm"
              onClick={() => {
                setTerm("");
                setSearchParams({}, { replace: true });
              }}
            >
              <Icon name="x" size={16} />
              Limpiar filtros
            </button>
          ) : null}
        </aside>

        {/* --- Resultados ---------------------------------------------------- */}
        <section aria-label="Resultados">
          <div className="bb-catalog__toolbar">
            <p className="bb-catalog__count" role="status" aria-live="polite">
              {loading
                ? "Buscando productos…"
                : `${formatNumber(total)} ${plural(total, "producto", "productos")}${
                    urlSearch ? ` para “${urlSearch}”` : ""
                  }`}
            </p>

            <div className="bb-catalog__sort">
              <label className="bb-label" htmlFor="catalog-sort">
                Ordenar por
              </label>
              <select
                id="catalog-sort"
                className="bb-select"
                value={sort ?? ""}
                onChange={(event) => updateParams({ sort: event.target.value || null })}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasFilters ? (
            <div className="bb-chips">
              {activeCategory ? (
                <span className="bb-chip">
                  Rubro: {activeCategory.name}
                  <button
                    type="button"
                    onClick={() => updateParams({ category: null })}
                    aria-label={`Quitar filtro de rubro ${activeCategory.name}`}
                  >
                    <Icon name="x" size={14} />
                  </button>
                </span>
              ) : null}

              {urlSearch ? (
                <span className="bb-chip">
                  Búsqueda: {urlSearch}
                  <button
                    type="button"
                    onClick={() => {
                      setTerm("");
                      updateParams({ search: null });
                    }}
                    aria-label="Quitar filtro de búsqueda"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </span>
              ) : null}

              {sort ? (
                <span className="bb-chip">
                  {SORT_OPTIONS.find((option) => option.value === sort)?.label}
                  <button
                    type="button"
                    onClick={() => updateParams({ sort: null })}
                    aria-label="Quitar el orden aplicado"
                  >
                    <Icon name="x" size={14} />
                  </button>
                </span>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <Alert
              tone="error"
              title="No pudimos cargar el catálogo"
              action={
                <button type="button" className="bb-btn bb-btn--secondary" onClick={reload}>
                  <Icon name="refresh" size={18} />
                  Reintentar
                </button>
              }
            >
              {error}
            </Alert>
          ) : loading ? (
            <ProductGridSkeleton count={PAGE_SIZE} />
          ) : products.length === 0 ? (
            /* Nunca dejamos un callejón sin salida: se ofrece una acción concreta. */
            <EmptyState
              icon="search-x"
              title={
                urlSearch
                  ? `Sin resultados para “${urlSearch}”`
                  : "No hay productos en este rubro"
              }
              description={
                urlSearch
                  ? "Probá con menos palabras o con el nombre genérico del material (por ejemplo “cemento” en vez de la marca)."
                  : "Probá quitando los filtros o mirá el catálogo completo."
              }
              action={
                <div className="bb-row">
                  <button
                    type="button"
                    className="bb-btn bb-btn--primary"
                    onClick={() => {
                      setTerm("");
                      setSearchParams({}, { replace: true });
                    }}
                  >
                    Ver catálogo completo
                  </button>
                  <Link className="bb-btn bb-btn--secondary" to="/contacto">
                    Consultar por encargo
                  </Link>
                </div>
              }
            />
          ) : (
            <>
              <div className="bb-product-grid">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    categoryName={categoryById.get(product.category_id)?.name}
                    image={imagesByProduct.get(product.id)?.[0]}
                  />
                ))}
              </div>

              <Pagination
                page={page}
                pages={data?.pages ?? 1}
                onChange={(nextPage) =>
                  updateParams({ page: nextPage > 1 ? String(nextPage) : null }, false)
                }
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
