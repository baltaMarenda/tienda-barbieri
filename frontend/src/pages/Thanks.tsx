import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Icon } from "../components/ui/Icon";

/** Estado que deja el checkout al navegar a /gracias. */
export interface ThanksState {
  orderId: number;
  whatsappUrl: string;
  /** Se marca al redirigir, para no volver a mandar a WhatsApp al volver con "atrás". */
  redirected?: boolean;
}

/** Segundos que se muestra la página antes de abrir WhatsApp. */
const REDIRECT_SECONDS = 4;

function isThanksState(value: unknown): value is ThanksState {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ThanksState).orderId === "number" &&
    typeof (value as ThanksState).whatsappUrl === "string"
  );
}

export function Thanks() {
  const { state } = useLocation();
  // Si se entra directo (o se recarga sin estado) se muestra el agradecimiento genérico.
  const order = isThanksState(state) ? state : null;
  const navigate = useNavigate();
  const autoRedirect = order !== null && !order.redirected;
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!autoRedirect || !order) return;
    if (secondsLeft > 0) {
      const timer = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
      return () => window.clearTimeout(timer);
    }
    // Se marca el historial antes de salir: al volver desde WhatsApp no se redirige de nuevo.
    navigate(".", { replace: true, state: { ...order, redirected: true } });
    // Misma pestaña: un window.open sin clic del usuario lo bloquean los navegadores.
    window.location.assign(order.whatsappUrl);
  }, [autoRedirect, order, secondsLeft, navigate]);

  return (
    <div className="bb-container bb-notfound bb-thanks">
      <span className="bb-thanks__icon" aria-hidden="true">
        <Icon name="check-circle" size={48} />
      </span>

      <h1>¡Gracias por tu compra!</h1>
      {order ? (
        <p className="bb-thanks__order">Pedido #{order.orderId}</p>
      ) : null}

      <p className="bb-muted" style={{ maxWidth: "48ch" }}>
        Recibimos tu pedido correctamente. En breve nos estaremos comunicando con vos para
        confirmar el stock, coordinar el pago y la entrega.
      </p>

      {order ? (
        <p className="bb-muted" style={{ maxWidth: "48ch" }}>
          {autoRedirect
            ? `Te llevamos a WhatsApp para enviarnos el detalle en ${secondsLeft} s…`
            : "Si todavía no lo hiciste, envianos el detalle del pedido por WhatsApp."}
        </p>
      ) : null}

      <div className="bb-row" style={{ marginTop: "var(--space-2)", justifyContent: "center" }}>
        {order ? (
          <a
            className="bb-btn bb-btn--primary"
            href={order.whatsappUrl}
          >
            <Icon name="message-circle" size={18} />
            Enviar por WhatsApp
          </a>
        ) : null}
        <Link
          className={`bb-btn ${order ? "bb-btn--secondary" : "bb-btn--primary"}`}
          to="/productos"
        >
          Seguir comprando
        </Link>
        <Link className="bb-btn bb-btn--secondary" to="/">
          <Icon name="home" size={18} />
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
