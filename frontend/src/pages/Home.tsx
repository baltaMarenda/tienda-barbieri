import { Link } from "react-router-dom";

import { ProductCard } from "../components/product/ProductCard";
import { Alert, EmptyState, ProductGridSkeleton } from "../components/ui/Feedback";
import { Icon } from "../components/ui/Icon";
import { useCategories } from "../hooks/useCategories";
import { useProductImages } from "../hooks/useProductImages";
import { useProducts } from "../hooks/useProducts";

const FEATURED_LIMIT = 8;

export function Home() {
  const { categories, categoryById, loading: loadingCategories } = useCategories();
  const imagesByProduct = useProductImages();
  const { data, loading, error, reload } = useProducts({ limit: FEATURED_LIMIT });

  const products = data?.items ?? [];

  return (
    <>
      {/* --- Rubros ------------------------------------------------------------ */}
      <section className="bb-container bb-section">
        <div className="bb-section-head">
          <div>
            <span
              className="bb-rule"
              style={{ display: "block", marginBottom: "var(--space-3)" }}
            />
            {/* Es el primer encabezado de la página, así que va como h1. */}
            <h1>Comprá por rubro</h1>
            <p className="bb-muted">Encontrá rápido lo que necesitás para tu obra.</p>
          </div>

          <Link className="bb-btn bb-btn--secondary" to="/productos">
            Ver todo el catálogo
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>

        {loadingCategories ? (
          <div className="bb-cat-grid">
            {Array.from({ length: 6 }, (_, index) => (
              <span
                key={index}
                className="bb-skeleton"
                style={{ height: 88, display: "block" }}
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            icon="layers"
            title="Todavía no hay rubros cargados"
            description="Cuando cargues categorías desde el panel de administración van a aparecer acá."
          />
        ) : (
          <div className="bb-cat-grid">
            {categories.map((category) => (
              <Link
                key={category.id}
                className="bb-cat-card"
                to={`/productos?category=${category.id}`}
              >
                <span className="bb-cat-card__icon">
                  <Icon name="package" size={24} />
                </span>
                <span>
                  <span className="bb-cat-card__name">{category.name}</span>
                  <span className="bb-cat-card__meta" style={{ display: "block" }}>
                    Ver productos
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* --- Destacados --------------------------------------------------------- */}
      <section className="bb-container bb-section" style={{ paddingTop: 0 }}>
        <div className="bb-section-head">
          <div>
            <span
              className="bb-rule"
              style={{ display: "block", marginBottom: "var(--space-3)" }}
            />
            <h2>Productos destacados</h2>
            <p className="bb-muted">Lo que más se mueve en el mostrador.</p>
          </div>

          <Link className="bb-btn bb-btn--secondary" to="/productos">
            Ver más productos
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>

        {error ? (
          <Alert
            tone="error"
            title="No pudimos cargar los productos"
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
          <ProductGridSkeleton count={FEATURED_LIMIT} />
        ) : products.length === 0 ? (
          <EmptyState
            title="Todavía no hay productos publicados"
            description="Cargá tu primer producto desde el panel de administración para que aparezca en la tienda."
            action={
              <Link className="bb-btn bb-btn--primary" to="/admin/productos">
                Ir al panel
              </Link>
            }
          />
        ) : (
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
        )}
      </section>
    </>
  );
}
