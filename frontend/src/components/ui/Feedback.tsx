import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

/* --- Spinner ---------------------------------------------------------------- */

export function Spinner({ large = false }: { large?: boolean }) {
  return (
    <span
      className={large ? "bb-spinner bb-spinner--lg" : "bb-spinner"}
      role="status"
      aria-label="Cargando"
    />
  );
}

/* --- Alertas ---------------------------------------------------------------- */

interface AlertProps {
  tone?: "error" | "success" | "info";
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}

const ALERT_ICON: Record<string, IconName> = {
  error: "alert-circle",
  success: "check-circle",
  info: "alert-circle",
};

export function Alert({ tone = "info", title, children, action }: AlertProps) {
  return (
    <div className={`bb-alert bb-alert--${tone}`} role={tone === "error" ? "alert" : undefined}>
      <Icon name={ALERT_ICON[tone]} size={20} />
      <div className="bb-alert__body">
        {title ? <strong>{title}</strong> : null}
        <div>{children}</div>
        {action ? <div style={{ marginTop: "var(--space-3)" }}>{action}</div> : null}
      </div>
    </div>
  );
}

/* --- Estado vacío ------------------------------------------------------------ */

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  /** Nunca dejamos un vacío mudo: siempre hay una salida concreta. */
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon = "package",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bb-empty">
      <span className="bb-empty__icon">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      {description ? <p className="bb-empty__text">{description}</p> : null}
      {action}
    </div>
  );
}

/* --- Skeletons --------------------------------------------------------------- */

/** Reserva el alto exacto de una tarjeta de producto para no mover el layout. */
export function ProductCardSkeleton() {
  return (
    <div className="bb-product-card" aria-hidden="true">
      <div className="bb-product-card__media">
        <span className="bb-skeleton" style={{ display: "block", height: "100%" }} />
      </div>
      <div className="bb-product-card__body">
        <span className="bb-skeleton" style={{ height: 12, width: "40%" }} />
        <span className="bb-skeleton" style={{ height: 16, width: "90%" }} />
        <span className="bb-skeleton" style={{ height: 16, width: "60%" }} />
        <div className="bb-product-card__foot">
          <span className="bb-skeleton" style={{ height: 24, width: "45%" }} />
        </div>
        <span className="bb-skeleton" style={{ height: 44, width: "100%" }} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="bb-product-grid">
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function TextSkeleton({ width = "100%", height = 16 }: { width?: string; height?: number }) {
  return <span className="bb-skeleton" style={{ display: "block", width, height }} />;
}
