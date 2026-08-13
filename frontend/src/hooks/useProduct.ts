import { useEffect, useState } from "react";

import { getProduct } from "../api/products";
import type { Product } from "../types";

interface UseProductResult {
  product: Product | null;
  loading: boolean;
  /** 404 del backend: el producto no existe o se dio de baja. */
  notFound: boolean;
  error: string | null;
}

interface Snapshot {
  id: number;
  product: Product | null;
  notFound: boolean;
  error: string | null;
}

export function useProduct(productId: number): UseProductResult {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const validId = Number.isInteger(productId) && productId > 0;

  useEffect(() => {
    if (!validId) return;

    const controller = new AbortController();
    let active = true;

    getProduct(productId, controller.signal)
      .then((data) => {
        if (!active) return;
        setSnapshot({ id: productId, product: data, notFound: false, error: null });
      })
      .catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        if (cause instanceof DOMException && cause.name === "AbortError") return;

        const status = (cause as { status?: number }).status;
        setSnapshot({
          id: productId,
          product: null,
          notFound: status === 404,
          error:
            status === 404
              ? null
              : cause instanceof Error
                ? cause.message
                : "Error inesperado al cargar el producto.",
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [productId, validId]);

  /* Un id inválido en la URL (p. ej. /productos/abc) es un 404 sin ir al server. */
  if (!validId) {
    return { product: null, loading: false, notFound: true, error: null };
  }

  const current = snapshot && snapshot.id === productId ? snapshot : null;

  return {
    product: current?.product ?? null,
    loading: current === null,
    notFound: current?.notFound ?? false,
    error: current?.error ?? null,
  };
}
