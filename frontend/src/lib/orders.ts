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

/** Aclaraciones que se muestran en el checkout y en la ficha de producto. */
export const SHIPPING_NOTE =
  "Envío dentro de Chivilcoy: $ 5.000 · Envío a la zona: $ 50.000 · Retiro en el local: gratis.";

export const CARD_NOTE =
  "Crédito en 3 cuotas: 10% de recargo con Banco Francés, Macro, Provincia y Galicia; 20% con los demás bancos.";

/** Envío a domicilio; se suma al total del pedido. */
export const LOCAL_SHIPPING_COST = 5000;
export const REGION_SHIPPING_COST = 50000;

/** Misma regla que `_is_chivilcoy` del backend: ignora mayúsculas y tildes. */
export function isChivilcoy(locality: string | null): boolean {
  return (locality ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .includes("chivilcoy");
}

/** Costo de envío que suma el backend al total (0 si retira o todavía no hay localidad). */
export function shippingCost(shipping: ShippingMethod, locality: string | null): number {
  if (shipping !== "delivery" || (locality ?? "").trim() === "") return 0;
  return isChivilcoy(locality) ? LOCAL_SHIPPING_COST : REGION_SHIPPING_COST;
}

/** "Envío dentro de Chivilcoy" / "Envío fuera de Chivilcoy" */
export function shippingFeeLabel(fee: number): string {
  return fee === LOCAL_SHIPPING_COST ? "Envío dentro de Chivilcoy" : "Envío fuera de Chivilcoy";
}

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

