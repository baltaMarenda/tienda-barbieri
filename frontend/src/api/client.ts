import { readStorage, removeStorage, STORAGE_KEYS, writeStorage } from "../lib/storage";

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/** Error normalizado del backend: siempre trae status y un mensaje mostrable. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/* --- Token ---------------------------------------------------------------- */

export function getToken(): string | null {
  return readStorage<string | null>(STORAGE_KEYS.token, null);
}

export function setToken(token: string): void {
  writeStorage(STORAGE_KEYS.token, token);
}

export function clearToken(): void {
  removeStorage(STORAGE_KEYS.token);
}

/**
 * El AuthContext se suscribe acá para cerrar sesión cuando el backend responde
 * 401 (token vencido: ACCESS_TOKEN_EXPIRE_MINUTES), sin que cada llamada tenga
 * que manejarlo por su cuenta.
 */
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

/* --- Request -------------------------------------------------------------- */

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Adjunta el Bearer token; obligatorio en los endpoints de admin. */
  auth?: boolean;
  signal?: AbortSignal;
}

/** FastAPI devuelve `detail` como string o como lista de errores de validación. */
function extractDetail(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim() !== "") return payload;

  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            const field = Array.isArray((item as { loc?: unknown }).loc)
              ? ((item as { loc: unknown[] }).loc.at(-1) ?? "")
              : "";
            const msg = String((item as { msg: unknown }).msg);
            return field ? `${field}: ${msg}` : msg;
          }
          return String(item);
        })
        .filter(Boolean);

      if (messages.length > 0) return messages.join(" · ");
    }
  }

  return `Error ${status} al comunicarse con el servidor.`;
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = false, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(
      0,
      "No pudimos conectarnos con el servidor. Verificá que el backend esté corriendo en " +
        API_URL,
    );
  }

  if (response.status === 401) {
    clearToken();
    onUnauthorized?.();
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, extractDetail(payload, response.status));
  }

  return payload as T;
}

/** Arma un query string omitiendo null, undefined y strings vacíos. */
export function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
