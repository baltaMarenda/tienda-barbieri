import { formatQuantity } from "../../lib/units";
import type { SaleUnit } from "../../types";

const LOW_STOCK_THRESHOLD = 5;

/**
 * El estado nunca se comunica sólo con color: el punto va siempre acompañado
 * del texto, para daltonismo y para lectores de pantalla.
 */
export function StockBadge({ stock, unit = "unit" }: { stock: number; unit?: SaleUnit }) {
  if (stock <= 0) {
    return (
      <span className="bb-badge bb-badge--danger">
        <span className="bb-badge__dot" />
        Sin stock
      </span>
    );
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <span className="bb-badge bb-badge--warning">
        <span className="bb-badge__dot" />
        {unit === "unit" ? `Últimas ${stock} u.` : `Últimas ${formatQuantity(stock, unit)}`}
      </span>
    );
  }

  return (
    <span className="bb-badge bb-badge--success">
      <span className="bb-badge__dot" />
      En stock
    </span>
  );
}
