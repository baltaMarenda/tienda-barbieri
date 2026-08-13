import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { getMe, login as loginRequest } from "../api/auth";
import { clearToken, getToken, setToken, setUnauthorizedHandler } from "../api/client";
import { AuthContext } from "./auth-context";
import type { AuthContextValue, AuthStatus } from "./auth-context";
import type { User } from "../types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    getToken() ? "loading" : "anonymous",
  );

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus("anonymous");
  }, []);

  /* Un 401 en cualquier request (token vencido) cierra la sesión una sola vez. */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus("anonymous");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  /* Rehidratación: si quedó un token guardado, se valida contra /users/me. */
  useEffect(() => {
    if (!getToken()) return;

    const controller = new AbortController();
    let active = true;

    getMe(controller.signal)
      .then((me) => {
        if (!active) return;
        setUser(me);
        setStatus("authenticated");
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        clearToken();
        setUser(null);
        setStatus("anonymous");
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { access_token } = await loginRequest(email, password);
    setToken(access_token);

    try {
      const me = await getMe();
      setUser(me);
      setStatus("authenticated");
      return me;
    } catch (error) {
      // El token sirve pero el perfil no se pudo leer: no dejamos media sesión.
      clearToken();
      setUser(null);
      setStatus("anonymous");
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAdmin: user?.role === "admin",
      signIn,
      signOut,
    }),
    [user, status, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
