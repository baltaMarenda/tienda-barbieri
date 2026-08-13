import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { Alert, Spinner } from "../components/ui/Feedback";
import { TextField } from "../components/ui/Field";
import { Icon } from "../components/ui/Icon";
import { Logo } from "../components/ui/Logo";
import { useAuth } from "../hooks/useAuth";

interface LocationState {
  from?: string;
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, status, isAdmin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as LocationState | null)?.from;

  /* Si ya hay sesión, esta página no tiene sentido. */
  useEffect(() => {
    if (status !== "authenticated") return;
    navigate(from ?? (isAdmin ? "/admin" : "/"), { replace: true });
  }, [status, isAdmin, from, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await signIn(email.trim(), password);
      navigate(from ?? (user.role === "admin" ? "/admin" : "/"), { replace: true });
    } catch (cause: unknown) {
      // El backend devuelve el mismo 401 para mail y contraseña, a propósito.
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos iniciar sesión. Intentá de nuevo.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="bb-auth">
      <div className="bb-auth__card">
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-6)" }}>
          <Logo asLink={false} />
        </div>

        <h1 style={{ fontSize: "var(--text-2xl)", textAlign: "center" }}>
          Acceso al panel
        </h1>
        <p
          className="bb-muted"
          style={{ textAlign: "center", marginTop: "var(--space-2)", fontSize: "var(--text-sm)" }}
        >
          Ingresá con tu cuenta para administrar productos, rubros e imágenes.
        </p>

        <form
          onSubmit={onSubmit}
          className="bb-stack"
          style={{ marginTop: "var(--space-6)" }}
          noValidate
        >
          {error ? <Alert tone="error">{error}</Alert> : null}

          <TextField
            label="Correo electrónico"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@empresa.com"
          />

          <TextField
            label="Contraseña"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button
            type="submit"
            className="bb-btn bb-btn--primary bb-btn--lg bb-btn--block"
            disabled={submitting || email.trim() === "" || password === ""}
          >
            {submitting ? <Spinner /> : <Icon name="lock" size={18} />}
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p
          className="bb-hint"
          style={{ textAlign: "center", marginTop: "var(--space-5)" }}
        >
          <Link to="/">Volver a la tienda</Link>
        </p>
      </div>
    </div>
  );
}
