import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md";
  /** Sobre fondos oscuros el logotipo pasa a blanco; el isotipo sigue azul. */
  inverse?: boolean;
  /** Si es false, se renderiza sin envolver en <Link> (útil dentro del footer). */
  asLink?: boolean;
}

/**
 * Reconstrucción vectorial del logo (isotipo + logotipo + bajada).
 * Colores muestreados del original: azul #049EE3, gris #7F7F7F.
 * Se usa SVG en vez del JPG para que escale nítido, no arrastre fondo blanco y
 * funcione igual sobre el footer oscuro.
 */
export function Logo({ size = "md", inverse = false, asLink = true }: LogoProps) {
  const className = [
    "bb-logo",
    size === "sm" ? "bb-logo--sm" : "",
    inverse ? "bb-logo--inverse" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <svg
        className="bb-logo__mark"
        viewBox="0 0 100 100"
        aria-hidden="true"
        focusable="false"
      >
        <mask id="bb-logo-mask">
          <rect width="100" height="100" rx="7" fill="#fff" />
          <path d="M50 55 L69 74 V100 H31 V74 Z" fill="#000" />
        </mask>
        <rect
          width="100"
          height="100"
          rx="7"
          fill="#049EE3"
          mask="url(#bb-logo-mask)"
        />
      </svg>

      <span className="bb-logo__text">
        <span className="bb-logo__name">BARBIERI</span>
        <span className="bb-logo__tagline">Construimos tu espacio</span>
      </span>
    </>
  );

  if (!asLink) {
    return <span className={className}>{content}</span>;
  }

  return (
    <Link to="/" className={className} aria-label="Barbieri — Ir al inicio">
      {content}
    </Link>
  );
}
