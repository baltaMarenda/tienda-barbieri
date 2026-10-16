/**
 * Wrapper de localStorage: serializa en JSON y nunca tira excepciones
 * (modo privado, cuota llena o datos corruptos devuelven el fallback).
 */

export const STORAGE_KEYS = {
  cart: "tienda-barbieri:cart",
  token: "tienda-barbieri:token",
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sin storage disponible: el estado sigue funcionando en memoria.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignorado a propósito.
  }
}
