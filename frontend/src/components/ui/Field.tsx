import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { Icon } from "./Icon";

interface BaseFieldProps {
  label: string;
  hint?: string;
  /** El error se muestra pegado al campo, no en un resumen arriba del form. */
  error?: string | null;
  optional?: boolean;
}

function FieldShell({
  label,
  hint,
  error,
  optional,
  controlId,
  hintId,
  errorId,
  children,
}: BaseFieldProps & {
  controlId: string;
  hintId: string;
  errorId: string;
  children: ReactNode;
}) {
  return (
    <div className="bb-field">
      <label className="bb-label" htmlFor={controlId}>
        {label}
        {optional ? <span className="bb-label__optional"> (opcional)</span> : null}
      </label>

      {children}

      {hint && !error ? (
        <span className="bb-hint" id={hintId}>
          {hint}
        </span>
      ) : null}

      {error ? (
        <span className="bb-error" id={errorId}>
          <Icon name="alert-circle" size={16} />
          {error}
        </span>
      ) : null}
    </div>
  );
}

/* --- Input ------------------------------------------------------------------- */

type TextFieldProps = BaseFieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

export function TextField({
  label,
  hint,
  error,
  optional,
  ...inputProps
}: TextFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      controlId={id}
      hintId={hintId}
      errorId={errorId}
    >
      <input
        {...inputProps}
        id={id}
        className="bb-input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
      />
    </FieldShell>
  );
}

/* --- Textarea ---------------------------------------------------------------- */

type TextareaFieldProps = BaseFieldProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "className">;

export function TextareaField({
  label,
  hint,
  error,
  optional,
  ...textareaProps
}: TextareaFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      controlId={id}
      hintId={hintId}
      errorId={errorId}
    >
      <textarea
        {...textareaProps}
        id={id}
        className="bb-textarea"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
      />
    </FieldShell>
  );
}

/* --- Select ------------------------------------------------------------------ */

type SelectFieldProps = BaseFieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className"> & {
    children: ReactNode;
  };

export function SelectField({
  label,
  hint,
  error,
  optional,
  children,
  ...selectProps
}: SelectFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      controlId={id}
      hintId={hintId}
      errorId={errorId}
    >
      <select
        {...selectProps}
        id={id}
        className="bb-select"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
      >
        {children}
      </select>
    </FieldShell>
  );
}
