import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { WhatsAppButton } from "./WhatsAppButton";

export function Layout() {
  const { pathname } = useLocation();

  /* Cada cambio de página vuelve al tope, como espera un usuario web. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <>
      <a className="bb-skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <Header />

      <main id="contenido">
        <Outlet />
      </main>

      <Footer />
      <WhatsAppButton />
      <CartDrawer />
    </>
  );
}
