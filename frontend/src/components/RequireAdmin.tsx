import { Link, Outlet } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { Login } from "../pages/Login";
import { Alert, Spinner } from "./ui/Feedback";

/**
 * Guarda de las rutas /admin. La autorización real la hace el backend con
 * `get_current_admin`; esto sólo evita mostrar una pantalla que igual fallaría.
 * Sin sesión muestra el formulario de ingreso: es el único punto de acceso.
 */
export function RequireAdmin() {
  const { status, isAdmin } = useAuth();

  if (status === "loading") {
    return (
      <div className="bb-container bb-section" style={{ display: "grid", placeItems: "center" }}>
        <Spinner large />
      </div>
    );
  }

  if (status === "anonymous") {
    return <Login />;
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
