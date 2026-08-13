import { useId } from "react";
import { Icon } from "./Icon";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Campo de búsqueda con ícono, label accesible y botón para limpiar. */
export function SearchInput({
  value,
  onChange,
  label,
  placeholder = "Buscar productos…",
  autoFocus,
}: SearchInputProps) {
  const id = useId();

  return (
    <div className="bb-search">
      <label className="bb-sr-only" htmlFor={id}>
        {label}
      </label>

      <span className="bb-search__icon" aria-hidden="true">
        <Icon name="search" size={18} />
      </span>

      <input
        id={id}
        type="search"
        className="bb-input bb-search__input"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        autoFocus={autoFocus}
        autoComplete="off"
      />

      {value ? (
        <button
          type="button"
          className="bb-icon-btn bb-search__clear"
          onClick={() => onChange("")}
          aria-label="Limpiar búsqueda"
        >
          <Icon name="x" size={16} />
        </button>
      ) : null}
    </div>
  );
}
