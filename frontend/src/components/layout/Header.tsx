import { useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { useCategories } from "../../hooks/useCategories";
import { SITE } from "../../lib/site";
import { Drawer } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { Logo } from "../ui/Logo";
import { SearchInput } from "../ui/SearchInput";

/** Rubros destacados en la barra de navegación de escritorio. */
const MAX_NAV_CATEGORIES = 5;

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { count, openCart } = useCart();
  const { isAdmin, user, signOut } = useAuth();
  const { categories } = useCategories();

  const urlSearch = searchParams.get("search") ?? "";
  const [term, setTerm] = useState(urlSearch);
  const [syncedSearch, setSyncedSearch] = useState(urlSearch);
  const [menuOpen, setMenuOpen] = useState(false);

  /* Ajuste durante el render (no en un efecto): cuando la búsqueda de la URL
     cambia desde afuera —el filtro del catálogo, el botón Atrás— el input del
     header se pone al día sin provocar un render en cascada. */
  if (urlSearch !== syncedSearch) {
    setSyncedSearch(urlSearch);
    setTerm(urlSearch);
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const query = term.trim();
    navigate(query ? `/productos?search=${encodeURIComponent(query)}` : "/productos");
  }

  /* NavLink sólo mira el pathname, así que el estado activo de los rubros
     (que se distinguen por query string) se calcula a mano. */
  const onCatalog = location.pathname === "/productos";
  const activeCategory = searchParams.get("category");
  const isCatalogActive = onCatalog && !activeCategory;
  const isCategoryActive = (id: number) => onCatalog && activeCategory === String(id);

  return (
    <header className="bb-header">
      <div className="bb-header__topbar">
        <div className="bb-container bb-header__topbar-inner">
          <span className="bb-header__topbar-item">
            <Icon name="truck" size={14} />
            Asesoramiento técnico y entregas a domicilio en Chivilcoy y la zona
          </span>

          <ul className="bb-header__topbar-list">
            <li className="bb-header__topbar-item">
              <Icon name="clock" size={14} />
              {SITE.hours}
            </li>
            <li className="bb-header__topbar-item">
              <Icon name="phone" size={14} />
              <a href={SITE.phoneHref} style={{ color: "inherit" }}>
                {SITE.phone}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="bb-container bb-header__main">
        <button
          type="button"
          className="bb-icon-btn"
          data-mobile-only
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú de navegación"
          aria-expanded={menuOpen}
        >
          <Icon name="menu" />
        </button>

        <Logo />

        <form className="bb-header__search" onSubmit={submitSearch} role="search">
          <SearchInput
            value={term}
            onChange={setTerm}
            label="Buscar productos en el catálogo"
            placeholder="Buscar cemento, ventanas, pintura…"
          />
        </form>

        <div className="bb-header__actions">
          {isAdmin ? (
            <NavLink to="/admin" className="bb-btn bb-btn--ghost bb-btn--sm">
              <Icon name="sliders" size={18} />
              <span data-desktop-only>Panel</span>
            </NavLink>
          ) : null}

          {user ? (
            <button
              type="button"
              className="bb-icon-btn"
              onClick={signOut}
              aria-label={`Cerrar sesión de ${user.name}`}
              title={`Cerrar sesión (${user.email})`}
            >
              <Icon name="log-out" />
            </button>
          ) : null}

          <button
            type="button"
            className="bb-icon-btn bb-cart-btn"
            onClick={openCart}
            aria-label={
              count > 0
                ? `Abrir carrito, ${count} ${count === 1 ? "unidad" : "unidades"}`
                : "Abrir carrito, está vacío"
            }
          >
            <Icon name="cart" />
            {count > 0 ? (
              <span className="bb-cart-btn__count" aria-hidden="true">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <nav className="bb-header__nav" aria-label="Navegación principal">
        <div className="bb-container">
          <ul className="bb-header__nav-list">
            <li>
              <NavLink to="/" className="bb-navlink" end>
                Inicio
              </NavLink>
            </li>
            <li>
              <Link
                to="/productos"
                className="bb-navlink"
                aria-current={isCatalogActive ? "page" : undefined}
              >
                Catálogo
              </Link>
            </li>

            {categories.slice(0, MAX_NAV_CATEGORIES).map((category) => (
              <li key={category.id}>
                <Link
                  to={`/productos?category=${category.id}`}
                  className="bb-navlink"
                  aria-current={isCategoryActive(category.id) ? "page" : undefined}
                >
                  {category.name}
                </Link>
              </li>
            ))}

            <li style={{ marginLeft: "auto" }}>
              <NavLink to="/contacto" className="bb-navlink">
                Contacto
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menú" side="left">
        <form
          onSubmit={submitSearch}
          role="search"
          style={{ marginBottom: "var(--space-5)" }}
        >
          <SearchInput
            value={term}
            onChange={setTerm}
            label="Buscar productos en el catálogo"
          />
        </form>

        {/* Delegación de clics: cualquier enlace de la navegación cierra el
            menú, en vez de un efecto que vigile los cambios de ruta. */}
        <nav aria-label="Navegación del menú" onClick={() => setMenuOpen(false)}>
        <ul>
          <li>
            <NavLink to="/" className="bb-mobile-menu__link" end>
              <Icon name="home" size={18} />
              Inicio
            </NavLink>
          </li>
          <li>
            <Link
              to="/productos"
              className="bb-mobile-menu__link"
              aria-current={isCatalogActive ? "page" : undefined}
            >
              <Icon name="grid" size={18} />
              Catálogo
            </Link>
          </li>
          <li>
            <NavLink to="/contacto" className="bb-mobile-menu__link">
              <Icon name="map-pin" size={18} />
              Contacto
            </NavLink>
          </li>
          {isAdmin ? (
            <li>
              <NavLink to="/admin" className="bb-mobile-menu__link">
                <Icon name="sliders" size={18} />
                Panel de administración
              </NavLink>
            </li>
          ) : null}
        </ul>

        {categories.length > 0 ? (
          <>
            <p
              className="bb-filters__group-title"
              style={{ marginTop: "var(--space-5)" }}
            >
              Rubros
            </p>
            <ul>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/productos?category=${category.id}`}
                    className="bb-mobile-menu__link"
                    aria-current={isCategoryActive(category.id) ? "page" : undefined}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        </nav>
      </Drawer>
    </header>
  );
}
