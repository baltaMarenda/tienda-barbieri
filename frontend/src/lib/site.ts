/**
 * Datos de contacto y marca que se muestran en header, footer y contacto.
 * TODO: reemplazar los valores de ejemplo por los reales del local.
 */
export const SITE = {
  name: "Tienda Barbieri",
  tagline: "Calidad de siempre, cerca tuyo.",
  description: "Productos seleccionados con atención personalizada.",
  phone: "+54 2346 551231",
  phoneHref: "tel:+542346551231",
  /* wa.me pide el número sin "+" y, para celulares de Argentina, con 9 tras el 54. */
  whatsappHref: "https://wa.me/5492346551231",
  email: "contacto@tiendabarbieri.com",
  address: "Av. 3 de Febrero 195, Chivilcoy",
  hours: "Lun a Vie · 8 a 12:30 y 14:30 a 19 h · Sáb · 8 a 12:30 h",
} as const;
