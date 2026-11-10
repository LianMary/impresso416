export const ORDER_STATUSES = [
  "aguardando_pagamento",
  "pago",
  "em_separacao",
  "enviado",
  "entregue",
  "cancelado",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  em_separacao: "Em separação",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const STATUS_CLASS: Record<OrderStatus, string> = {
  aguardando_pagamento: "bg-sun text-sun-ink",
  pago: "bg-sky text-sky-ink",
  em_separacao: "bg-berry text-berry-ink",
  enviado: "bg-coral text-coral-ink",
  entregue: "bg-mint text-mint-ink",
  cancelado: "bg-muted text-muted-foreground",
};

export const CATEGORY_CLASS: Record<string, string> = {
  coral: "bg-coral text-coral-ink",
  mint: "bg-mint text-mint-ink",
  sun: "bg-sun text-sun-ink",
  sky: "bg-sky text-sky-ink",
  grape: "bg-berry text-berry-ink",
  berry: "bg-berry text-berry-ink",
};
export const CATEGORY_COLORS = ["coral", "mint", "sun", "sky", "berry"];
