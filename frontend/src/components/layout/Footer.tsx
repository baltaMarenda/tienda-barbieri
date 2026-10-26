import { Link } from "react-router-dom";

import { useCategories } from "../../hooks/useCategories";
import { SITE } from "../../lib/site";
import { Icon } from "../ui/Icon";
import { Logo } from "../ui/Logo";

export function Footer() {
  const { categories } = useCategories();
  const year = new Date().getFullYear();

  return (
    <footer className="bb-footer">
      <div className="bb-container bb-footer__grid">
        <div>
          <Logo inverse asLink={false} />
          <p className="bb-footer__brand-text">{SITE.description}</p>
        </div>

        <div>
          <h2 className="bb-footer__col-title">Rubros</h2>
          <ul className="bb-footer__list">
            {categories.length > 0 ? (
              categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link to={`/productos?category=${category.id}`}>{category.name}</Link>
                </li>
              ))
            ) : (
              <li>
                <Link to="/productos">Ver catálogo completo</Link>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h2 className="bb-footer__col-title">Tienda</h2>
          <ul className="bb-footer__list">
            <li>
              <Link to="/productos">Catálogo</Link>
            </li>
            <li>
              <Link to="/contacto">Contacto</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="bb-footer__col-title">Contacto</h2>
          <ul className="bb-footer__list">
            <li>
              <a href={SITE.phoneHref}>
                <Icon name="phone" size={16} />
                {SITE.phone}
              </a>
            </li>
            <li>
              <a href={SITE.instagramHref} target="_blank" rel="noopener noreferrer">
                <Icon name="instagram" size={16} />
                {SITE.instagram}
              </a>
            </li>
            <li className="bb-footer__item">
              <Icon name="map-pin" size={16} />
              {SITE.address}
            </li>
            <li className="bb-footer__item">
              <Icon name="clock" size={16} />
              {SITE.hours}
            </li>
          </ul>
        </div>
      </div>

      <div className="bb-container bb-footer__bottom">
        <span>
          © {year} {SITE.name}. Todos los derechos reservados.
        </span>
        <span>{SITE.tagline}</span>
      </div>
    </footer>
  );
}
