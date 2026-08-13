import { useEffect, useState } from "react";

/**
 * Retrasa la propagación de un valor que cambia con cada tecla. Evita disparar
 * un GET /products/ por caracter mientras se escribe en el buscador.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
