import { Link } from "react-router-dom";

import { formatPrice, plural } from "../../lib/format";
import { useCart } from "../../hooks/useCart";
import { Drawer } from "../ui/Dialog";
import { EmptyState } from "../ui/Feedback";
import { Icon } from "../ui/Icon";

export function CartDrawer() {
  const { lines, count, total, isOpen, closeCart, setQuantity, remove, clear } =
    useCart();

  const footer =
    lines.length === 0 ? null : (
      <>
        <div className="bb-cart-total">
          <span className="bb-cart-total__label">Total estimado</span>
          <span className="bb-price">{formatPrice(total)}</span>
        </div>

        {/* El backend todavía no expone pedidos: se dice explícitamente en vez
            de mostrar un botón de checkout que no haría nada. */}
        <p className="bb-hint" style={{ marginBottom: "var(--space-4)" }}>
          El carrito se guarda en este dispositivo. Todavía no hay checkout en
          línea: acercate al local o escribinos para cerrar el pedido.
        </p>

        <div className="bb-stack" style={{ gap: "var(--space-2)" }}>
          <Link
            className="bb-btn bb-btn--primary bb-btn--block"
            to="/contacto"
            onClick={closeCart}
          >
            Consultar por este pedido
            <Icon name="arrow-right" size={18} />
          </Link>

          <button
            type="button"
            className="bb-btn bb-btn--ghost bb-btn--block"
            onClick={clear}
          >
            <Icon name="trash" size={18} />
            Vaciar carrito
          </button>
        </div>
      </>
    );

  return (
    <Drawer open={isOpen} onClose={closeCart} title="Tu carrito" footer={footer}>
      {lines.length === 0 ? (
        <EmptyState
          icon="cart"
          title="El carrito está vacío"
          description="Agregá productos desde el catálogo para armar tu pedido."
          action={
            <Link className="bb-btn bb-btn--primary" to="/productos" onClick={closeCart}>
              Ver catálogo
              <Icon name="arrow-right" size={18} />
            </Link>
          }
        />
      ) : (
        <>
          <p
            className="bb-muted"
            style={{ fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}
          >
            {count} {plural(count, "unidad", "unidades")} · {lines.length}{" "}
            {plural(lines.length, "producto", "productos")}
          </p>

          <ul>
            {lines.map((line) => (
              <li key={line.productId} className="bb-cart-line">
                <div className="bb-cart-line__media">
                  {line.imageUrl ? (
                    <img src={line.imageUrl} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className="bb-media-empty">
                      <Icon name="image" size={18} />
                    </span>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <Link
                    to={`/productos/${line.productId}`}
                    className="bb-cart-line__name"
                    onClick={closeCart}
                  >
                    {line.name}
                  </Link>

                  <p className="bb-muted" style={{ fontSize: "var(--text-sm)" }}>
                    {formatPrice(line.price)} c/u
                  </p>

                  <div className="bb-cart-line__foot">
                    <div className="bb-qty">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        aria-label={`Quitar una unidad de ${line.name}`}
                      >
                        <Icon name="minus" size={16} />
                      </button>

                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={line.stock}
                        value={line.quantity}
                        aria-label={`Cantidad de ${line.name}`}
                        onChange={(event) =>
                          setQuantity(line.productId, Number(event.target.value))
                        }
                      />

                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        disabled={line.quantity >= line.stock}
                        aria-label={`Agregar una unidad de ${line.name}`}
                      >
                        <Icon name="plus" size={16} />
                      </button>
                    </div>

                    <span style={{ marginLeft: "auto", fontWeight: 700 }}>
                      {formatPrice(line.price * line.quantity)}
                    </span>

                    <button
                      type="button"
                      className="bb-icon-btn"
                      onClick={() => remove(line.productId)}
                      aria-label={`Quitar ${line.name} del carrito`}
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  </div>

                  {line.quantity >= line.stock ? (
                    <p className="bb-hint">Máximo disponible: {line.stock} u.</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  );
}
