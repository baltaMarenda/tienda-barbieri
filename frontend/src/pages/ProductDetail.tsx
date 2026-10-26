import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AreaQuantity } from "../components/product/AreaQuantity";
import { ProductCard } from "../components/product/ProductCard";
import { StockBadge } from "../components/product/StockBadge";
import { Alert, ProductGridSkeleton, TextSkeleton } from "../components/ui/Feedback";
import { Icon } from "../components/ui/Icon";
import { useCart } from "../hooks/useCart";
import { useCategories } from "../hooks/useCategories";
import { useProduct } from "../hooks/useProduct";
import { useProductImages } from "../hooks/useProductImages";
import { useProducts } from "../hooks/useProducts";
import { mediaUrl } from "../api/client";
import { formatNumber, formatPrice } from "../lib/format";
import { formatQuantity, formatUnitPrice, saleTerms, unitLabel } from "../lib/units";
import { CARD_NOTE, SHIPPING_NOTE } from "../lib/orders";
import { SITE } from "../lib/site";

const RELATED_LIMIT = 4;

/**
 * La vista se remonta con `key` al cambiar de producto: la imagen activa y la
 * cantidad elegida arrancan de cero sin efectos de reseteo.
 */
export function ProductDetail() {
  const { id } = useParams();
  return <ProductDetailView key={id} productId={Number(id)} />;
}

function ProductDetailView({ productId }: { productId: number }) {
  const { categoryById } = useCategories();
  const imagesByProduct = useProductImages();
  const { add } = useCart();
  const { product, loading, notFound, error } = useProduct(productId);

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const images = imagesByProduct.get(productId) ?? [];
  const category = product ? categoryById.get(product.category_id) : undefined;
  const terms = product ? saleTerms(product) : null;

  /* Relacionados: mismo rubro. Se piden recién cuando sabemos la categoría. */
  const { data: relatedData } = useProducts({
    limit: RELATED_LIMIT + 1,
    category_id: product?.category_id ?? null,
  });

  const related = (relatedData?.items ?? [])
    .filter((item) => item.id !== productId)
    .slice(0, RELATED_LIMIT);

  if (notFound) {
    return (
      <div className="bb-container bb-section bb-container--narrow">
        <Alert
          tone="error"
          title="No encontramos ese producto"
          action={
            <Link className="bb-btn bb-btn--primary" to="/productos">
              Volver al catálogo
            </Link>
          }
        >
          Puede que se haya dado de baja o que el enlace esté mal escrito.
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bb-container bb-section bb-container--narrow">
        <Alert tone="error" title="No pudimos cargar el producto">
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="bb-container bb-section" style={{ paddingTop: 0 }}>
      <nav className="bb-breadcrumbs" aria-label="Miga de pan">
        <Link to="/">Inicio</Link>
        <Icon name="chevron-right" size={14} />
        <Link to="/productos">Catálogo</Link>
        {category ? (
          <>
            <Icon name="chevron-right" size={14} />
            <Link to={`/productos?category=${category.id}`}>{category.name}</Link>
          </>
        ) : null}
        {product ? (
          <>
            <Icon name="chevron-right" size={14} />
            <span aria-current="page">{product.name}</span>
          </>
        ) : null}
      </nav>

      <div className="bb-pdp">
        {/* --- Galería -------------------------------------------------------- */}
        <div className="bb-gallery">
          <div className="bb-gallery__main">
            {loading ? (
              <span className="bb-skeleton" style={{ display: "block", height: "100%" }} />
            ) : images.length > 0 ? (
              <img
                src={images[activeImage] ? mediaUrl(images[activeImage].url) : undefined}
                alt={images[activeImage]?.alt || product?.name || ""}
                decoding="async"
              />
            ) : (
              <span className="bb-media-empty">
                <Icon name="image" size={40} />
              </span>
            )}
          </div>

          {images.length > 1 ? (
            <div className="bb-gallery__thumbs">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className="bb-gallery__thumb"
                  aria-current={index === activeImage}
                  aria-label={`Ver imagen ${index + 1} de ${images.length}: ${image.alt}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={mediaUrl(image.url)} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* --- Ficha ---------------------------------------------------------- */}
        <div>
          {loading || !product || !terms ? (
            <div className="bb-stack">
              <TextSkeleton width="30%" height={14} />
              <TextSkeleton width="80%" height={36} />
              <TextSkeleton width="100%" height={80} />
              <TextSkeleton width="50%" height={44} />
            </div>
          ) : (
            <>
              {category ? (
                <Link
                  to={`/productos?category=${category.id}`}
                  className="bb-badge bb-badge--brand"
                  style={{ textDecoration: "none" }}
                >
                  {category.name}
                </Link>
              ) : null}

              <h1 className="bb-pdp__title">{product.name}</h1>

              {product.description ? (
                <p className="bb-lead" style={{ marginTop: "var(--space-4)" }}>
                  {product.description}
                </p>
              ) : null}

              <div className="bb-pdp__price-box">
                <span className="bb-price bb-price--lg">
                  {formatUnitPrice(product.price, product.price_unit)}
                </span>
                <p className="bb-hint" style={{ marginTop: "var(--space-1)" }}>
                  {product.price_unit === "m2"
                    ? "Precio final por metro cuadrado, IVA incluido."
                    : `Precio final por ${unitLabel(1, terms.unit === "box" ? "box" : product.price_unit)}, IVA incluido.`}
                  {terms.unit === "box" && product.price_unit === "m2" && terms.m2PerBox
                    ? ` Se vende por caja de ${formatQuantity(terms.m2PerBox, "m2")}: ${formatPrice(terms.unitPrice)} la caja.`
                    : null}
                </p>

                <div style={{ marginTop: "var(--space-4)" }}>
                  <StockBadge stock={terms.available} unit={terms.unit} />
                  {terms.available > 0 ? (
                    <span
                      className="bb-muted"
                      style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-sm)" }}
                    >
                      {formatQuantity(terms.available, terms.unit)}{" "}
                      {terms.available === 1 ? "disponible" : "disponibles"}
                      {terms.unit === "box" && terms.m2PerBox
                        ? ` (${formatQuantity(terms.available * terms.m2PerBox, "m2")})`
                        : null}
                    </span>
                  ) : null}
                </div>
              </div>

              {terms.available > 0 ? (
                <>
                  {terms.unit === "box" && terms.m2PerBox ? (
                    <AreaQuantity
                      boxes={quantity}
                      onChange={setQuantity}
                      m2PerBox={terms.m2PerBox}
                      available={terms.available}
                      boxPrice={terms.unitPrice}
                    />
                  ) : (
                    <div className="bb-pdp__qty">
                      <span className="bb-label" id="pdp-qty-label">
                        Cantidad{terms.unit === "unit" ? "" : ` (${unitLabel(2, terms.unit)})`}
                      </span>

                      <div className="bb-qty" role="group" aria-labelledby="pdp-qty-label">
                        <button
                          type="button"
                          onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                          disabled={quantity <= 1}
                          aria-label={`Restar una ${unitLabel(1, terms.unit)}`}
                        >
                          <Icon name="minus" size={16} />
                        </button>

                        <input
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={terms.available}
                          value={quantity}
                          aria-label="Cantidad a agregar"
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            if (Number.isNaN(next)) return;
                            setQuantity(
                              Math.min(Math.max(1, Math.trunc(next)), terms.available),
                            );
                          }}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((value) => Math.min(terms.available, value + 1))
                          }
                          disabled={quantity >= terms.available}
                          aria-label={`Sumar una ${unitLabel(1, terms.unit)}`}
                        >
                          <Icon name="plus" size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="bb-btn bb-btn--primary bb-btn--lg bb-btn--block"
                    onClick={() => add(product, images[0]?.url ?? null, quantity)}
                    disabled={quantity < 1}
                  >
                    <Icon name="cart" size={20} />
                    Agregar al carrito · {formatPrice(terms.unitPrice * quantity)}
                  </button>
                </>
              ) : (
                <Alert
                  tone="info"
                  title="Sin stock por el momento"
                  action={
                    <Link className="bb-btn bb-btn--primary" to="/contacto">
                      Consultar disponibilidad
                    </Link>
                  }
                >
                  Podemos avisarte cuando vuelva a entrar o cotizarte una alternativa
                  equivalente.
                </Alert>
              )}

              <table className="bb-specs">
                <caption className="bb-sr-only">Datos del producto</caption>
                <tbody>
                  <tr>
                    <th scope="row">Código</th>
                    <td>#{product.id}</td>
                  </tr>
                  <tr>
                    <th scope="row">Rubro</th>
                    <td>{category?.name ?? "—"}</td>
                  </tr>
                  <tr>
                    <th scope="row">Stock</th>
                    <td>
                      {product.stock_unit === "unit" && terms.unit !== "box"
                        ? `${formatNumber(product.stock)} u.`
                        : formatQuantity(product.stock, terms.unit === "box" && product.stock_unit === "unit" ? "box" : product.stock_unit)}
                    </td>
                  </tr>
                  {terms.m2PerBox ? (
                    <tr>
                      <th scope="row">Rinde por caja</th>
                      <td>{formatQuantity(terms.m2PerBox, "m2")}</td>
                    </tr>
                  ) : null}
                  <tr>
                    <th scope="row">Retiro</th>
                    <td>{SITE.address}</td>
                  </tr>
                  <tr>
                    <th scope="row">Envío</th>
                    <td>{SHIPPING_NOTE}</td>
                  </tr>
                  <tr>
                    <th scope="row">Tarjeta</th>
                    <td>{CARD_NOTE}</td>
                  </tr>
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* --- Relacionados ------------------------------------------------------- */}
      {product ? (
        <section style={{ marginTop: "var(--space-9)" }}>
          <div className="bb-section-head">
            <div>
              <span
                className="bb-rule"
                style={{ display: "block", marginBottom: "var(--space-3)" }}
              />
              <h2>También del rubro {category?.name ?? "seleccionado"}</h2>
            </div>
          </div>

          {relatedData === null ? (
            <ProductGridSkeleton count={RELATED_LIMIT} />
          ) : related.length === 0 ? (
            <p className="bb-muted">No hay otros productos cargados en este rubro.</p>
          ) : (
            <div className="bb-product-grid">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  categoryName={categoryById.get(item.category_id)?.name}
                  image={imagesByProduct.get(item.id)?.[0]}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
