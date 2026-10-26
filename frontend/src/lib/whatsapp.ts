import { formatPrice } from "./format";
import { PAYMENT_LABELS, SHIPPING_LABELS, shippingFeeLabel } from "./orders";
import { SITE } from "./site";
import { formatQuantity } from "./units";
import type { CartLine, PaymentMethod, ShippingMethod } from "../types";

export interface WhatsAppOrder {
  id: number;
  name: string;
  locality: string | null;
  payment: PaymentMethod;
  shipping: ShippingMethod;
  address: string | null;
  notes: string | null;
  lines: CartLine[];
  /** Costo de envío ya incluido en `total`. */
  shippingFee: number;
  total: number;
}

/** "• 7 cajas (10,08 m²) · Porcelanato Gris 60x60 — $ 105.000" */
function lineDetail(line: CartLine): string {
  let quantity = formatQuantity(line.quantity, line.unit);
  if (line.unit === "box" && line.m2PerBox) {
    quantity += ` (${formatQuantity(line.quantity * line.m2PerBox, "m2")})`;
  }
  return `• ${quantity} · ${line.name} — ${formatPrice(line.price * line.quantity)}`;
}

export function orderMessage(order: WhatsAppOrder): string {
  const shipping =
    order.shipping === "delivery" && order.address
      ? `${SHIPPING_LABELS.delivery} (${order.address})`
      : SHIPPING_LABELS[order.shipping];

  return [
    `Hola! Les escribo desde el sitio web para hacerles el siguiente pedido:`,
    "*Datos de contacto:*",
    `• Nombre: ${order.name}`,
    ...(order.locality ? [`• Localidad: ${order.locality}`] : []),
    "",
    "*Detalle de los productos:*",
    "",
    ...order.lines.map(lineDetail),
    ...(order.shippingFee > 0
      ? [`• ${shippingFeeLabel(order.shippingFee)} — ${formatPrice(order.shippingFee)}`]
      : []),
    "",
    `*Total estimado:* ${formatPrice(order.total)}`,
    `*Entrega:* ${shipping}`,
    `*Pago:* ${PAYMENT_LABELS[order.payment]}`,
    ...(order.notes ? [`*Notas:* ${order.notes}`] : []),
  ].join("\n");
}

/** Enlace wa.me al número del local con el mensaje precargado. */
export function whatsappOrderUrl(order: WhatsAppOrder): string {
  return `${SITE.whatsappHref}?text=${encodeURIComponent(orderMessage(order))}`;
}
