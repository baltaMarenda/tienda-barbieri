import { useCallback, useEffect, useMemo, useState } from "react";

import { getCategories, invalidateCategoriesCache } from "../api/categories";
import type { Category } from "../types";

interface UseCategoriesResult {
  categories: Category[];
  /** Búsqueda O(1) del nombre de rubro por `category_id` del producto. */
  categoryById: Map<number, Category>;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

interface Snapshot {
  nonce: number;
  categories: Category[];
  error: string | null;
}

const NO_CATEGORIES: Category[] = [];

export function useCategories(): UseCategoriesResult {
  const [nonce, setNonce] = useState(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let active = true;

    getCategories()
      .then((data) => {
        if (!active) return;
        setSnapshot({ nonce, categories: data, error: null });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setSnapshot({
          nonce,
          categories: NO_CATEGORIES,
          error: cause instanceof Error ? cause.message : "No pudimos cargar los rubros.",
        });
      });

    return () => {
      active = false;
    };
  }, [nonce]);

  /* Mientras el nonce no coincida, lo que hay en pantalla es viejo: loading. */
  const current = snapshot && snapshot.nonce === nonce ? snapshot : null;
  const categories = current?.categories ?? NO_CATEGORIES;

  const reload = useCallback(() => {
    invalidateCategoriesCache();
    setNonce((value) => value + 1);
  }, []);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  return {
    categories,
    categoryById,
    loading: current === null,
    error: current?.error ?? null,
    reload,
  };
}
