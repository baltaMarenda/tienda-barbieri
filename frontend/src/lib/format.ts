const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-AR");

/** $ 12.345 */
export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

/** 12.345 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** plural(1, "producto", "productos") → "producto" */
export function plural(count: number, singular: string, pluralForm: string): string {
  return count === 1 ? singular : pluralForm;
}
