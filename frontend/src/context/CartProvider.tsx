import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { readStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";
import { saleTerms } from "../lib/units";
import { CartContext } from "./cart-context";
import type { CartContextValue } from "./cart-context";
import type { CartLine, Product } from "../types";

/**
 * Carrito 100% del lado del cliente: el backend todavía no expone endpoints de
 * carrito ni de pedidos. El estado vive en localStorage y el total se calcula
 * acá, así que cuando exista `POST /orders/` sólo hay que enviar `lines`.
 */

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.productId === "number" &&
    typeof line.name === "string" &&
    typeof line.price === "number" &&
    typeof line.stock === "number" &&
    typeof line.quantity === "number" &&
    line.quantity > 0
  );
}

function loadCart(): CartLine[] {
  const raw = readStorage<unknown>(STORAGE_KEYS.cart, []);
  if (!Array.isArray(raw)) return [];
  // Los carritos guardados antes de existir las unidades de venta eran por unidad.
  return raw.filter(isCartLine).map((line) => ({ ...line, unit: line.unit ?? "unit" }));
}

function clamp(quantity: number, stock: number): number {
  const max = Math.max(stock, 0);
  return Math.min(Math.max(Math.trunc(quantity), 1), Math.max(max, 1));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.cart, lines);
  }, [lines]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const add = useCallback(
    (product: Product, imageUrl: string | null, quantity = 1) => {
      const terms = saleTerms(product);
      if (terms.available <= 0) return;

      setLines((current) => {
        const index = current.findIndex((line) => line.productId === product.id);

        if (index === -1) {
          const line: CartLine = {
            productId: product.id,
            name: product.name,
            price: terms.unitPrice,
            stock: terms.available,
            unit: terms.unit,
            imageUrl,
            quantity: clamp(quantity, terms.available),
          };
          return [...current, line];
        }

        // Producto ya en el carrito: se acumula y se re-sincronizan precio/stock/unidad.
        const next = [...current];
        const existing = next[index];
        next[index] = {
          ...existing,
          price: terms.unitPrice,
          stock: terms.available,
          unit: terms.unit,
          imageUrl: imageUrl ?? existing.imageUrl,
          quantity: clamp(existing.quantity + quantity, terms.available),
        };
        return next;
      });

      setIsOpen(true);
    },
    [],
  );

  const setQuantity = useCallback((productId: number, quantity: number) => {
    setLines((current) => {
      if (quantity <= 0) {
        return current.filter((line) => line.productId !== productId);
      }
      return current.map((line) =>
        line.productId === productId
          ? { ...line, quantity: clamp(quantity, line.stock) }
          : line,
      );
    });
  }, []);

  const remove = useCallback((productId: number) => {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

    return {
      lines,
      count,
      distinctCount: lines.length,
      total,
      isOpen,
      openCart,
      closeCart,
      add,
      setQuantity,
      remove,
      clear,
    };
  }, [lines, isOpen, openCart, closeCart, add, setQuantity, remove, clear]);

  return <CartContext value={value}>{children}</CartContext>;
}
