import { formatNumber } from "../../lib/format";

const LOW_STOCK_THRESHOLD = 5;

/**
 * El estado nunca se comunica sólo con color: el punto va siempre acompañado
 * del texto, para daltonismo y para lectores de pantalla.
 */
export function StockBadge({ stock }: { stock: number }) {
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
        {`Últimas ${formatNumber(stock)} u.`}
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
