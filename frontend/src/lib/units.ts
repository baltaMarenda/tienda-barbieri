import { formatNumber, formatPrice } from "./format";
import type { Product, SaleUnit } from "../types";

/**
 * Rubros que se venden por caja o por m². Se detectan por nombre, sin tildes
 * ni mayúsculas: "Cerámicos", "Ceramicos", "Revestimientos cerámicos", etc.
 */
const AREA_CATEGORY_PATTERN = /ceram|porcelanat/;

export function isCeramicCategory(name: string | undefined): boolean {
  if (!name) return false;
  const normalized = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return AREA_CATEGORY_PATTERN.test(normalized);
}

const LABELS: Record<SaleUnit, { singular: string; plural: string; short: string }> = {
  unit: { singular: "unidad", plural: "unidades", short: "u." },
  box: { singular: "caja", plural: "cajas", short: "caja" },
  m2: { singular: "m²", plural: "m²", short: "m²" },
};

/** unitLabel(3, "box") → "cajas" */
export function unitLabel(quantity: number, unit: SaleUnit): string {
  return quantity === 1 ? LABELS[unit].singular : LABELS[unit].plural;
}

/** formatQuantity(12.5, "m2") → "12,5 m²" */
export function formatQuantity(quantity: number, unit: SaleUnit): string {
  return `${formatNumber(quantity)} ${unitLabel(quantity, unit)}`;
}

/** formatUnitPrice(9500, "m2") → "$ 9.500 / m²"; en unidades no agrega sufijo. */
export function formatUnitPrice(price: number, unit: SaleUnit): string {
  return unit === "unit" ? formatPrice(price) : `${formatPrice(price)} / ${LABELS[unit].short}`;
}

export interface SaleTerms {
  /** Unidad en la que se agrega al carrito. */
  unit: SaleUnit;
  /** Precio de una `unit`. */
  unitPrice: number;
  /** Cantidad entera disponible, expresada en `unit`. */
  available: number;
  m2PerBox: number | null;
}

/**
 * Cómo se vende un producto. Si se conocen los m² por caja, se vende por
 * cajas completas (el precio por m² se convierte a precio por caja);
 * si no, en la misma unidad en la que está expresado el precio.
 */
export function saleTerms(product: Product): SaleTerms {
  const m2PerBox = product.m2_per_box && product.m2_per_box > 0 ? product.m2_per_box : null;
  // Con m² por caja cargados se vende por caja; "unidad" se toma como una caja.
  if (m2PerBox) {
    const unitPrice =
      product.price_unit === "m2" ? product.price * m2PerBox : product.price;
    // El epsilon evita que 14,4 m² / 1,44 m² por caja dé 9,999… cajas.
    const boxes =
      product.stock_unit === "m2" ? product.stock / m2PerBox + 1e-9 : product.stock;
    return { unit: "box", unitPrice, available: Math.floor(boxes), m2PerBox };
  }

  return {
    unit: product.price_unit,
    unitPrice: product.price,
    available: Math.floor(product.stock),
    m2PerBox,
  };
}
