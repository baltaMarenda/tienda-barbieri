import { createContext } from "react";
import type { CartLine, Product } from "../types";

export interface CartContextValue {
  lines: CartLine[];
  /** Unidades totales (suma de cantidades). */
  count: number;
  /** Productos distintos. */
  distinctCount: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (product: Product, imageUrl: string | null, quantity?: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
