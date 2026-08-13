import { Link } from "react-router-dom";

import { Icon } from "../components/ui/Icon";

export function NotFound() {
  return (
    <div className="bb-container bb-notfound">
      <span className="bb-notfound__code">404</span>
      <h1>Esta página no existe</h1>
      <p className="bb-muted" style={{ maxWidth: "46ch" }}>
        Puede que el enlace esté mal escrito o que el contenido se haya dado de baja.
      </p>

      <div className="bb-row" style={{ marginTop: "var(--space-2)" }}>
        <Link className="bb-btn bb-btn--primary" to="/">
          <Icon name="home" size={18} />
          Ir al inicio
        </Link>
        <Link className="bb-btn bb-btn--secondary" to="/productos">
          Ver catálogo
        </Link>
      </div>
    </div>
  );
}
