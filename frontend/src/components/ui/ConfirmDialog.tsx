import { Modal } from "./Dialog";
import { Spinner } from "./Feedback";
import { Icon } from "./Icon";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación explícita antes de cualquier borrado (acción irreversible). */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      title={title}
      footer={
        <>
          <button
            type="button"
            className="bb-btn bb-btn--secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="bb-btn bb-btn--danger"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <Spinner /> : <Icon name="trash" size={18} />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{description}</p>
    </Modal>
  );
}
