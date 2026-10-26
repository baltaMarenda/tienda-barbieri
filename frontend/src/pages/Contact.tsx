import { useState } from "react";
import type { FormEvent } from "react";

import { SelectField, TextareaField, TextField } from "../components/ui/Field";
import { Alert } from "../components/ui/Feedback";
import { Icon } from "../components/ui/Icon";
import type { IconName } from "../components/ui/Icon";
import { useCart } from "../hooks/useCart";
import { formatPrice } from "../lib/format";
import { formatQuantity } from "../lib/units";
import { SITE } from "../lib/site";

const SUBJECTS = [
  "Consulta por un pedido",
  "Cotización de materiales",
  "Disponibilidad y stock",
  "Asesoramiento técnico",
  "Otro",
];

const CHANNELS: { icon: IconName; label: string; value: string; href?: string }[] = [
  { icon: "phone", label: "Teléfono", value: SITE.phone, href: SITE.phoneHref },
  { icon: "instagram", label: "Instagram", value: SITE.instagram, href: SITE.instagramHref },
  { icon: "map-pin", label: "Dirección", value: SITE.address },
  { icon: "clock", label: "Horarios", value: SITE.hours },
];

export function Contact() {
  const { lines, total } = useCart();

  const [subject, setSubject] = useState(
    lines.length > 0 ? SUBJECTS[0] : SUBJECTS[1],
  );
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  /* El carrito viaja en el cuerpo del mensaje: la consulta sale por WhatsApp,
     así que no hace falta pedir correo ni teléfono. */
  const cartSummary =
    lines.length > 0
      ? [
          "",
          "--- Pedido armado en la web ---",
          ...lines.map(
            (line) =>
              `• ${formatQuantity(line.quantity, line.unit ?? "unit")} × ${line.name} — ${formatPrice(line.price * line.quantity)}`,
          ),
          `Total estimado: ${formatPrice(total)}`,
        ].join("\n")
      : "";

  function onSubmit(event: FormEvent) {
    event.preventDefault();

    const body = [
      `Hola! Soy ${name}, les escribo desde la web.`,
      `*Motivo:* ${subject}`,
      "",
      message,
      cartSummary,
    ]
      .filter(Boolean)
      .join("\n");

    window.open(
      `${SITE.whatsappHref}?text=${encodeURIComponent(body)}`,
      "_blank",
      "noopener,noreferrer",
    );

    setSent(true);
  }

  return (
    <div className="bb-container bb-section">
      <div style={{ marginBottom: "var(--space-7)" }}>
        <span className="bb-rule" style={{ display: "block", marginBottom: "var(--space-3)" }} />
        <h1>Contacto</h1>
        <p className="bb-lead" style={{ maxWidth: "56ch" }}>
          Escribinos por una cotización, disponibilidad de stock o asesoramiento para
          tu obra. Respondemos dentro del horario comercial.
        </p>
      </div>

      <div className="bb-catalog">
        <aside className="bb-filters" aria-label="Datos de contacto">
          <div className="bb-card">
            <div className="bb-card__body bb-stack">
              {CHANNELS.map((channel) => (
                <div key={channel.label} className="bb-usp__item">
                  <span className="bb-usp__icon">
                    <Icon name={channel.icon} size={20} />
                  </span>
                  <div>
                    <p className="bb-usp__title">{channel.label}</p>
                    {channel.href ? (
                      <a href={channel.href} className="bb-usp__text">
                        {channel.value}
                      </a>
                    ) : (
                      <p className="bb-usp__text">{channel.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <section>
          {sent ? (
            <Alert tone="success" title="Abrimos WhatsApp">
              Si no se abrió solo, escribinos al <strong>{SITE.phone}</strong> o
              por Instagram a <strong>{SITE.instagram}</strong>.
            </Alert>
          ) : null}

          {lines.length > 0 ? (
            <Alert tone="info" title="Tu pedido se adjunta al mensaje">
              Vamos a incluir los {lines.length} productos del carrito y el total
              estimado de {formatPrice(total)} en el mensaje.
            </Alert>
          ) : null}

          <form
            onSubmit={onSubmit}
            className="bb-stack"
            style={{ marginTop: "var(--space-5)" }}
          >
            <div className="bb-form-grid">
              <TextField
                label="Nombre y apellido"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />

              <SelectField
                label="Motivo"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              >
                {SUBJECTS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectField>

              <div className="bb-form-grid--full">
                <TextareaField
                  label="Mensaje"
                  required
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  hint="Contanos qué material necesitás, cantidades y para cuándo."
                />
              </div>
            </div>

            <div>
              <button type="submit" className="bb-btn bb-btn--primary bb-btn--lg">
                <Icon name="message-circle" size={20} />
                Enviar consulta
              </button>
              <p className="bb-hint" style={{ marginTop: "var(--space-2)" }}>
                Se abre WhatsApp con el mensaje ya redactado.
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
