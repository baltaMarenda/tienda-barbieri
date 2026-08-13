import { useCallback, useEffect, useState } from "react";

import { getProducts } from "../api/products";
import type { ProductListResponse, ProductQuery } from "../types";

interface UseProductsResult {
  data: ProductListResponse | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface Snapshot {
  key: string;
  data: ProductListResponse | null;
  error: string | null;
}

/**
 * Lista paginada de productos.
 *
 * `loading` no es un estado propio sino algo derivado: se compara la clave de
 * la consulta actual con la del último resultado guardado. Así el efecto sólo
 * escribe estado en sus callbacks asíncronos, sin renders en cascada, y no hace
 * falta sincronizar dos estados a mano. Cada consulta nueva aborta la anterior
 * para que una respuesta lenta no pise a una más reciente.
 */
export function useProducts(query: ProductQuery): UseProductsResult {
  const {
    page = 1,
    limit = 12,
    sort = null,
    category_id = null,
    search = null,
  } = query;

  const [nonce, setNonce] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const key = `${page}|${limit}|${sort ?? ""}|${category_id ?? ""}|${search ?? ""}|${nonce}`;

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    getProducts({ page, limit, sort, category_id, search }, controller.signal)
      .then((response) => {
        if (!active) return;
        setSnapshot({ key, data: response, error: null });
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setSnapshot({
          key,
          data: null,
          error:
            cause instanceof Error ? cause.message : "No pudimos cargar los productos.",
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [key, page, limit, sort, category_id, search]);

  const current = snapshot && snapshot.key === key ? snapshot : null;
  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return {
    data: current?.data ?? null,
    loading: current === null,
    error: current?.error ?? null,
    reload,
  };
}
