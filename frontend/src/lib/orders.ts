import type { OrderStatus, PaymentMethod, ShippingMethod } from "../types";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia bancaria",
  card: "Tarjeta de débito / crédito",
};

export const SHIPPING_LABELS: Record<ShippingMethod, string> = {
  pickup: "Retiro en el local",
  delivery: "Envío a domicilio",
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Recibido",
  delivered: "Entregado",
};

/** El backend guarda la fecha en UTC sin zona: se agrega la Z para no leerla como local. */
export function parseServerDate(value: string): Date {
  return new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`);
}

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** 19/10/26, 14:30 */
export function formatOrderDate(value: string): string {
  return dateFormatter.format(parseServerDate(value));
}

