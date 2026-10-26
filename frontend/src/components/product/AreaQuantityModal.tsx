import { useState } from "react";

import { useCart } from "../../hooks/useCart";
import { formatPrice } from "../../lib/format";
import { formatUnitPrice, saleTerms } from "../../lib/units";
import type { Product } from "../../types";
import { Modal } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { AreaQuantity } from "./AreaQuantity";

/**
 * Agregar al carrito un cerámico desde el catálogo o el home: se elige por
 * caja o por m² sin pasar por la ficha. Se monta sólo mientras está abierto.
 */
export function AreaQuantityModal({
  product,
  imageUrl,
  onClose,
}: {
  product: Product;
  imageUrl: string | null;
  onClose: () => void;
}) {
  const { add } = useCart();
  const terms = saleTerms(product);
  const [boxes, setBoxes] = useState(1);

  return (
    <Modal
      open
      onClose={onClose}
      title={product.name}
      footer={
        <>
          <button type="button" className="bb-btn bb-btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="bb-btn bb-btn--primary"
            disabled={boxes < 1}
            onClick={() => {
              add(product, imageUrl, boxes);
              onClose();
            }}
          >
            <Icon name="cart" size={18} />
            Agregar · {formatPrice(terms.unitPrice * boxes)}
          </button>
        </>
      }
    >
      <p className="bb-muted">
        {formatUnitPrice(product.price, product.price_unit)}
        {product.price_unit === "m2" ? ` · ${formatPrice(terms.unitPrice)} la caja` : null}
      </p>

      <AreaQuantity
        boxes={boxes}
        onChange={setBoxes}
        m2PerBox={terms.m2PerBox ?? 1}
        available={terms.available}
        boxPrice={terms.unitPrice}
      />
    </Modal>
  );
}
