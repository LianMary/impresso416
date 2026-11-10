export const FREE_SHIPPING_FROM = 150;
export const SHIPPING_FEE = 15;
export type DeliveryMethod = "entrega" | "retirada";

/** Mirrors place_order in the database: delivery costs R$ 15, free from R$ 150; pickup is free. */
export function shippingFor(subtotal: number, method: DeliveryMethod) {
  if (method === "retirada") return 0;
  return subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
}
