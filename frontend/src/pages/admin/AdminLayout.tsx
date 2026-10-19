import { NavLink, Outlet } from "react-router-dom";

import { Icon } from "../../components/ui/Icon";
import { useAuth } from "../../hooks/useAuth";

const SECTIONS = [
  { to: "/admin/pedidos", label: "Pedidos", icon: "cart" },
  { to: "/admin/productos", label: "Productos", icon: "package" },
  { to: "/admin/categorias", label: "Rubros", icon: "layers" },
  { to: "/admin/imagenes", label: "Imágenes", icon: "image" },
] as const;

export function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="bb-container bb-admin">
      <nav className="bb-admin__nav" aria-label="Secciones del panel">
        <p className="bb-filters__group-title" style={{ width: "100%" }}>
          Panel
        </p>

        {SECTIONS.map((section) => (
          <NavLink key={section.to} to={section.to} className="bb-admin__nav-link">
            <Icon name={section.icon} size={18} />
            {section.label}
          </NavLink>
        ))}

        {user ? (
          <p className="bb-hint" style={{ marginTop: "var(--space-4)" }}>
            Sesión de {user.name}
            <br />
            {user.email}
          </p>
        ) : null}
      </nav>

      <div style={{ minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}
