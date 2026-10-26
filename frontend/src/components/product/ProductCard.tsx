import { useState } from "react";
import { Link } from "react-router-dom";

import { mediaUrl } from "../../api/client";
import { formatUnitPrice, saleTerms } from "../../lib/units";
import { useCart } from "../../hooks/useCart";
import { Icon } from "../ui/Icon";
import { AreaQuantityModal } from "./AreaQuantityModal";
import { StockBadge } from "./StockBadge";
import type { Product, ProductImage } from "../../types";

interface ProductCardProps {
  product: Product;
  categoryName?: string;
  image?: ProductImage;
}

export function ProductCard({ product, categoryName, image }: ProductCardProps) {
  const { add } = useCart();
  const href = `/productos/${product.id}`;
  const terms = saleTerms(product);
  const outOfStock = terms.available <= 0;
  // Los cerámicos por caja abren la calculadora caja / m² antes de agregar.
  const byArea = terms.unit === "box" && terms.m2PerBox !== null;
  const [calculatorOpen, setCalculatorOpen] = useState(false);

  return (
    <article className="bb-product-card">
      {/* El contenedor tiene aspect-ratio fijo: la imagen no desplaza el layout. */}
      <Link className="bb-product-card__media" to={href} tabIndex={-1} aria-hidden="true">
        {image ? (
          <img
            className="bb-product-card__img"
            src={mediaUrl(image.url)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="bb-media-empty">
            <Icon name="image" size={28} />
          </span>
        )}

        <span className="bb-product-card__badges">
          <StockBadge stock={terms.available} unit={terms.unit} />
        </span>
      </Link>

      <div className="bb-product-card__body">
        {categoryName ? (
          <span className="bb-product-card__cat">{categoryName}</span>
        ) : null}

        <h3 className="bb-product-card__name bb-clamp-2">
          <Link to={href}>{product.name}</Link>
        </h3>

        {product.description ? (
          <p className="bb-product-card__desc bb-clamp-2">{product.description}</p>
        ) : null}

        <div className="bb-product-card__foot">
          <span className="bb-price">{formatUnitPrice(product.price, product.price_unit)}</span>
        </div>

        <button
          type="button"
          className="bb-btn bb-btn--primary bb-product-card__cta"
          onClick={() =>
            byArea ? setCalculatorOpen(true) : add(product, image?.url ?? null, 1)
          }
          disabled={outOfStock}
          aria-label={
            outOfStock
              ? `${product.name} sin stock`
              : `Agregar ${product.name} al carrito`
          }
        >
          <Icon name={outOfStock ? "alert-circle" : "cart"} size={18} />
          {outOfStock ? "Sin stock" : "Agregar"}
        </button>
      </div>

      {calculatorOpen ? (
        <AreaQuantityModal
          product={product}
          imageUrl={image?.url ?? null}
          onClose={() => setCalculatorOpen(false)}
        />
      ) : null}
    </article>
  );
}
