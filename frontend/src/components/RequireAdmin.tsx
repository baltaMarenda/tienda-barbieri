import { Link, Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { Alert, Spinner } from "./ui/Feedback";

/**
 * Guarda de las rutas /admin. La autorización real la hace el backend con
 * `get_current_admin`; esto sólo evita mostrar una pantalla que igual fallaría.
 */
export function RequireAdmin() {
  const { status, isAdmin } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="bb-container bb-section" style={{ display: "grid", placeItems: "center" }}>
        <Spinner large />
      </div>
    );
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <div className="bb-container bb-section bb-container--narrow">
        <Alert
          tone="error"
          title="No tenés permisos para entrar al panel"
          action={
            <Link className="bb-btn bb-btn--secondary" to="/">
              Volver a la tienda
            </Link>
          }
        >
          Tu cuenta existe pero no tiene el rol <code>admin</code>. Pedile a un
          administrador que actualice tu usuario.
        </Alert>
      </div>
    );
  }

  return <Outlet />;
}
