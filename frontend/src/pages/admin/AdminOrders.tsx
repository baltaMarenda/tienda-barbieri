import { useEffect, useState } from "react";

import { getOrders, updateOrderStatus } from "../../api/orders";
import { Alert, EmptyState, Spinner } from "../../components/ui/Feedback";
import { Icon } from "../../components/ui/Icon";
import { Pagination } from "../../components/ui/Pagination";
import { useToast } from "../../hooks/useToast";
import { formatPrice, plural } from "../../lib/format";
import {
  formatOrderDate,
  PAYMENT_LABELS,
  SHIPPING_LABELS,
  STATUS_LABELS,
  shippingFeeLabel,
} from "../../lib/orders";
import { formatQuantity, formatUnitPrice } from "../../lib/units";
import type { Order, OrderListResponse, OrderStatus } from "../../types";

const PAGE_SIZE = 20;

const STATUS_FILTERS: { value: OrderStatus | null; label: string }[] = [
  { value: null, label: "Todos" },
  { value: "received", label: STATUS_LABELS.received },
  { value: "delivered", label: STATUS_LABELS.delivered },
];

interface Snapshot {
  key: string;
  data: OrderListResponse | null;
  error: string | null;
}

/* --- Tarjeta de pedido ---------------------------------------------------------- */

interface OrderCardProps {
  order: Order;
  saving: boolean;
  onStatusChange: (order: Order, status: OrderStatus) => void;
}

function OrderCard({ order, saving, onStatusChange }: OrderCardProps) {
  // El envío no es una línea del pedido: es lo que el total tiene por encima de los productos.
  const itemsTotal = order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const fee = Math.round(order.total - itemsTotal);
  const delivered = order.status === "delivered";

  return (
    <article className="bb-card bb-order" aria-labelledby={`order-${order.id}`}>
      <header className="bb-order__head">
        <div>
          <h2 id={`order-${order.id}`} className="bb-order__title">
            Pedido #{order.id}
          </h2>
          <p className="bb-muted" style={{ fontSize: "var(--text-sm)" }}>
            {formatOrderDate(order.created_at)}
          </p>
        </div>

        <div className="bb-order__status">
          <span className={`bb-badge ${delivered ? "bb-badge--success" : "bb-badge--warning"}`}>
            <span className="bb-badge__dot" />
            {STATUS_LABELS[order.status]}
          </span>

          <label className="bb-sr-only" htmlFor={`order-status-${order.id}`}>
            Estado del pedido #{order.id}
          </label>
          <select
            id={`order-status-${order.id}`}
            className="bb-select bb-order__select"
            value={order.status}
            disabled={saving}
            onChange={(event) => onStatusChange(order, event.target.value as OrderStatus)}
          >
            <option value="received">{STATUS_LABELS.received}</option>
            <option value="delivered">{STATUS_LABELS.delivered}</option>
          </select>
          {saving ? <Spinner /> : null}
        </div>
      </header>

      <dl className="bb-order__info">
        <div>
          <dt>Comprador</dt>
          <dd>
            <strong>{order.customer_name}</strong>
            <a className="bb-order__phone" href={`tel:${order.customer_phone}`}>
              <Icon name="phone" size={16} />
              {order.customer_phone}
            </a>
            {order.customer_locality ? (
              <span className="bb-order__address">
                <Icon name="map-pin" size={16} />
                {order.customer_locality}
              </span>
            ) : null}
          </dd>
        </div>

        <div>
          <dt>Pago</dt>
          <dd>{PAYMENT_LABELS[order.payment_method]}</dd>
        </div>

        <div>
          <dt>Envío</dt>
          <dd>
            {SHIPPING_LABELS[order.shipping_method]}
            {order.shipping_method === "delivery" && order.shipping_address ? (
              <span className="bb-order__address">
                <Icon name="map-pin" size={16} />
                {order.shipping_address}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      <div className="bb-table-wrap">
        <table className="bb-table">
          <caption className="bb-sr-only">Productos del pedido #{order.id}</caption>
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col" className="bb-table__num">Cantidad</th>
              <th scope="col" className="bb-table__num">Precio</th>
              <th scope="col" className="bb-table__num">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.product_name}
                  {item.product_id === null ? (
                    <span className="bb-hint"> (producto eliminado)</span>
                  ) : null}
                </td>
                <td className="bb-table__num">{formatQuantity(item.quantity, item.unit)}</td>
                <td className="bb-table__num">{formatUnitPrice(item.unit_price, item.unit)}</td>
                <td className="bb-table__num">{formatPrice(item.unit_price * item.quantity)}</td>
              </tr>
            ))}
            {fee > 0 ? (
              <tr>
                <td>{shippingFeeLabel(fee)}</td>
                <td className="bb-table__num">—</td>
                <td className="bb-table__num">—</td>
                <td className="bb-table__num">{formatPrice(fee)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <footer className="bb-order__foot">
        {order.notes ? (
          <p className="bb-order__notes">
            <strong>Notas:</strong> {order.notes}
          </p>
        ) : (
          <span />
        )}
        <p className="bb-order__total">
          <span className="bb-cart-total__label">Importe total</span>
          <span className="bb-price">{formatPrice(order.total)}</span>
        </p>
      </footer>
    </article>
  );
}

/* --- Página -------------------------------------------------------------------- */

export function AdminOrders() {
  const { notify } = useToast();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [nonce, setNonce] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  /* Igual que useProducts: `loading` se deriva comparando la clave de la consulta. */
  const key = `${page}|${status ?? ""}|${nonce}`;

  useEffect(() => {
    const controller = new AbortController();

    getOrders({ page, limit: PAGE_SIZE, status }, controller.signal)
      .then((data) => setSnapshot({ key, data, error: null }))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setSnapshot({
          key,
          data: null,
          error: cause instanceof Error ? cause.message : "No pudimos cargar los pedidos.",
        });
      });

    return () => controller.abort();
  }, [key, page, status]);

  const current = snapshot && snapshot.key === key ? snapshot : null;
  const loading = current === null;
  const data = current?.data ?? null;
  const reload = () => setNonce((value) => value + 1);

  async function onStatusChange(order: Order, next: OrderStatus) {
    if (next === order.status) return;

    setSavingId(order.id);
    try {
      const updated = await updateOrderStatus(order.id, next);
      setSnapshot((prev) =>
        prev?.data
          ? {
              ...prev,
              data: {
                ...prev.data,
                items: prev.data.items.map((item) => (item.id === updated.id ? updated : item)),
              },
            }
          : prev,
      );
      notify(`El pedido #${order.id} quedó como “${STATUS_LABELS[next]}”.`);
    } catch (cause: unknown) {
      notify(
        cause instanceof Error ? cause.message : "No pudimos actualizar el pedido.",
        "error",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <div className="bb-admin__head">
        <div>
          <h1 style={{ fontSize: "var(--text-2xl)" }}>Pedidos</h1>
          <p className="bb-muted" style={{ fontSize: "var(--text-sm)" }}>
            Los pedidos que llegan desde el carrito de la tienda, del más nuevo al más viejo.
          </p>
        </div>

        <button type="button" className="bb-btn bb-btn--secondary" onClick={reload}>
          <Icon name="refresh" size={18} />
          Actualizar
        </button>
      </div>

      <div className="bb-admin__toolbar">
        <div className="bb-chips" role="group" aria-label="Filtrar por estado">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.label}
              type="button"
              className={`bb-btn bb-btn--sm ${
                status === filter.value ? "bb-btn--primary" : "bb-btn--secondary"
              }`}
              aria-pressed={status === filter.value}
              onClick={() => {
                setStatus(filter.value);
                setPage(1);
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {data ? (
          <p className="bb-muted" style={{ fontSize: "var(--text-sm)", alignSelf: "center" }}>
            {data.total} {plural(data.total, "pedido", "pedidos")}
          </p>
        ) : null}
      </div>

      {current?.error ? (
        <Alert
          tone="error"
          title="No pudimos cargar los pedidos"
          action={
            <button type="button" className="bb-btn bb-btn--secondary" onClick={reload}>
              <Icon name="refresh" size={18} />
              Reintentar
            </button>
          }
        >
          {current.error}
        </Alert>
      ) : loading ? (
        <div style={{ display: "grid", placeItems: "center", padding: "var(--space-8)" }}>
          <Spinner large />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon="package"
          title={status ? `No hay pedidos “${STATUS_LABELS[status]}”` : "Todavía no hay pedidos"}
          description="Cuando un cliente confirme su carrito, el pedido va a aparecer acá."
        />
      ) : (
        <>
          <div className="bb-stack" style={{ gap: "var(--space-4)" }}>
            {data.items.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                saving={savingId === order.id}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>

          <Pagination page={page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </>
  );
}
