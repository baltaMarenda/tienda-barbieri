import { useState } from "react";
import type { FormEvent } from "react";

import { createOrder } from "../../api/orders";
import { useCart } from "../../hooks/useCart";
import { useToast } from "../../hooks/useToast";
import { formatPrice } from "../../lib/format";
import {
  CARD_NOTE,
  PAYMENT_LABELS,
  SHIPPING_LABELS,
  SHIPPING_NOTE,
  shippingCost,
  shippingFeeLabel,
} from "../../lib/orders";
import { whatsappOrderUrl } from "../../lib/whatsapp";
import type { PaymentMethod, ShippingMethod } from "../../types";
import { Modal } from "../ui/Dialog";
import { SelectField, TextareaField, TextField } from "../ui/Field";
import { Alert, Spinner } from "../ui/Feedback";
import { Icon } from "../ui/Icon";

interface FieldErrors {
  name?: string;
  phone?: string;
  locality?: string;
  address?: string;
}

/** Se monta sólo mientras está abierto, así cada apertura arranca limpia. */
export function CheckoutModal({ onClose }: { onClose: () => void }) {
  const { lines, total, clear } = useCart();
  const { notify } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [locality, setLocality] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [shipping, setShipping] = useState<ShippingMethod>("pickup");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const shippingFee = shippingCost(shipping, locality);
  const grandTotal = total + shippingFee;

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (name.trim() === "") next.name = "Decinos tu nombre.";
    if (phone.replace(/\D/g, "").length < 6) next.phone = "Poné un teléfono de contacto válido.";
    if (shipping === "delivery") {
      if (locality.trim() === "") next.locality = "Indicá tu localidad o barrio.";
      if (address.trim() === "") next.address = "Indicá la dirección de entrega.";
    }
    return next;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setFormError(null);

    try {
      const order = await createOrder({
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_locality: shipping === "delivery" ? locality.trim() : null,
        payment_method: payment,
        shipping_method: shipping,
        shipping_address: shipping === "delivery" ? address.trim() : null,
        notes: notes.trim() || null,
        items: lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
      });
      // Se arma con el total del carrito antes de vaciarlo; el backend ya lo recalculó.
      const url = whatsappOrderUrl({
        id: order.id,
        name: order.customer_name,
        locality: shipping === "delivery" ? locality.trim() : null,
        payment: order.payment_method,
        shipping: order.shipping_method,
        address: order.shipping_address,
        notes: order.notes,
        lines,
        shippingFee: shippingCost(order.shipping_method, order.customer_locality),
        total: order.total,
      });
      clear();
      onClose();
      notify(`¡Recibimos tu pedido #${order.id}! Te llevamos a WhatsApp para enviarlo.`);
      // Se navega en la misma pestaña: un window.open después del await lo bloquean los navegadores.
      window.location.assign(url);
    } catch (cause: unknown) {
      setFormError(
        cause instanceof Error ? cause.message : "No pudimos enviar el pedido.",
      );
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Finalizar pedido"
      footer={
        <>
          <button
            type="button"
            className="bb-btn bb-btn--secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="checkout-form"
            className="bb-btn bb-btn--primary"
            disabled={saving || lines.length === 0}
          >
            {saving ? <Spinner /> : <Icon name="check-circle" size={18} />}
            {saving ? "Enviando…" : `Enviar por WhatsApp · ${formatPrice(grandTotal)}`}
          </button>
        </>
      }
    >
      <form id="checkout-form" onSubmit={onSubmit} className="bb-stack" noValidate>
        {formError ? <Alert tone="error">{formError}</Alert> : null}

        <TextField
          label="Nombre y apellido"
          autoComplete="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (errors.name) setErrors({ ...errors, name: undefined });
          }}
          error={errors.name}
          required
        />

        <TextField
          label="Teléfono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            if (errors.phone) setErrors({ ...errors, phone: undefined });
          }}
          error={errors.phone}
          hint="Te escribimos a este número para coordinar."
          required
        />

        <SelectField
          label="Método de envío"
          value={shipping}
          onChange={(event) => setShipping(event.target.value as ShippingMethod)}
          hint={SHIPPING_NOTE}
        >
          {(Object.keys(SHIPPING_LABELS) as ShippingMethod[]).map((method) => (
            <option key={method} value={method}>
              {SHIPPING_LABELS[method]}
            </option>
          ))}
        </SelectField>

        {shipping === "delivery" ? (
          <>
            <TextField
              label="Localidad"
              autoComplete="address-level2"
              value={locality}
              onChange={(event) => {
                setLocality(event.target.value);
                if (errors.locality) setErrors({ ...errors, locality: undefined });
              }}
              error={errors.locality}
              hint="Localidad o barrio."
              required
            />

            <TextField
              label="Dirección de entrega"
              autoComplete="street-address"
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                if (errors.address) setErrors({ ...errors, address: undefined });
              }}
              error={errors.address}
              hint="Calle, número, piso/depto."
              required
            />
          </>
        ) : null}

        <SelectField
          label="Método de pago"
          value={payment}
          onChange={(event) => setPayment(event.target.value as PaymentMethod)}
          hint={payment === "card" ? CARD_NOTE : undefined}
        >
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map((method) => (
            <option key={method} value={method}>
              {PAYMENT_LABELS[method]}
            </option>
          ))}
        </SelectField>

        {shippingFee > 0 ? (
          <Alert tone="info">
            {shippingFeeLabel(shippingFee)}: se suman {formatPrice(shippingFee)} al total (
            {formatPrice(total)} + {formatPrice(shippingFee)} = {formatPrice(grandTotal)}).
          </Alert>
        ) : null}

        <TextareaField
          label="Notas"
          optional
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </form>
    </Modal>
  );
}
