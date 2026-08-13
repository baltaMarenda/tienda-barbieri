import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { Icon } from "./Icon";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportamiento común de modal y drawer: bloqueo de scroll del fondo, cierre
 * con Escape, foco inicial adentro, foco atrapado mientras está abierto y
 * devolución del foco al elemento que lo abrió al cerrar.
 */
function useDialogBehaviour(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement as HTMLElement | null;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = overflow;
      openerRef.current?.focus?.();
    };
  }, [open, onClose]);

  return panelRef;
}

/* --- Drawer (carrito, menú móvil) -------------------------------------------- */

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "right" | "left";
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useDialogBehaviour(open, onClose);

  if (!open) return null;

  return createPortal(
    <>
      <div className="bb-overlay" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={side === "left" ? "bb-mobile-menu" : "bb-drawer"}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="bb-drawer__head">
          <h2 id={titleId} style={{ fontSize: "var(--text-lg)" }}>
            {title}
          </h2>
          <button
            type="button"
            className="bb-icon-btn"
            onClick={onClose}
            aria-label={`Cerrar ${title.toLowerCase()}`}
          >
            <Icon name="x" />
          </button>
        </div>

        <div className={side === "left" ? "bb-mobile-menu__body" : "bb-drawer__body"}>
          {children}
        </div>

        {footer ? <div className="bb-drawer__foot">{footer}</div> : null}
      </div>
    </>,
    document.body,
  );
}

/* --- Modal (formularios del panel admin) -------------------------------------- */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const titleId = useId();
  const panelRef = useDialogBehaviour(open, onClose);

  if (!open) return null;

  return createPortal(
    <>
      <div className="bb-overlay" onClick={onClose} aria-hidden="true" />
      <div className="bb-modal-wrap">
        <div
          ref={panelRef}
          className="bb-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <div className="bb-modal__head">
            <h2 id={titleId} style={{ fontSize: "var(--text-lg)" }}>
              {title}
            </h2>
            <button
              type="button"
              className="bb-icon-btn"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <Icon name="x" />
            </button>
          </div>

          <div className="bb-modal__body">{children}</div>

          {footer ? <div className="bb-modal__foot">{footer}</div> : null}
        </div>
      </div>
    </>,
    document.body,
  );
}
