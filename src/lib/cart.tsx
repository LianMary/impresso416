import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image?: string;
  stock: number;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "papelaria-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.reduce((a, i) => a + i.quantity, 0),
      subtotal: items.reduce((a, i) => a + i.price * i.quantity, 0),
      add: (item, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((p) => p.product_id === item.product_id);
          if (found)
            return prev.map((p) =>
              p.product_id === item.product_id
                ? { ...p, ...item, quantity: Math.min(item.stock, p.quantity + qty) }
                : p,
            );
          return [...prev, { ...item, quantity: Math.min(item.stock, qty) }];
        }),
      setQty: (id, qty) =>
        setItems((prev) =>
          prev.map((p) =>
            p.product_id === id ? { ...p, quantity: Math.max(1, Math.min(p.stock, qty)) } : p,
          ),
        ),
      remove: (id) => setItems((prev) => prev.filter((p) => p.product_id !== id)),
      clear: () => setItems([]),
    }),
    [items],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCart = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
};
