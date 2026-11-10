import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { FREE_SHIPPING_FROM } from "@/lib/shipping";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Impresso416" },
      { name: "description", content: "Revise os itens do seu carrinho." },
      { property: "og:title", content: "Carrinho — Impresso416" },
      { property: "og:description", content: "Revise os itens do seu carrinho." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { items, subtotal, setQty, remove } = useCart();
  if (items.length === 0)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-6xl">🛍️</p>
        <h1 className="mt-4 text-2xl font-extrabold">Seu carrinho está vazio</h1>
        <p className="mt-2 text-muted-foreground">Que tal dar uma olhada nas novidades?</p>
        <Button asChild className="mt-6"><Link to="/catalogo">Explorar catálogo</Link></Button>
      </div>
    );

  const missing = FREE_SHIPPING_FROM - subtotal;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Carrinho</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.product_id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
              <Link to="/produto/$slug" params={{ slug: i.slug }} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24">
                {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <Link to="/produto/$slug" params={{ slug: i.slug }} className="font-bold leading-snug">{i.name}</Link>
                  <Button variant="ghost" size="icon" onClick={() => remove(i.product_id)} aria-label="Remover"><Trash2 /></Button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-input">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(i.product_id, i.quantity - 1)} aria-label="Diminuir"><Minus /></Button>
                    <span className="w-8 text-center text-sm font-bold">{i.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQty(i.product_id, i.quantity + 1)} aria-label="Aumentar"><Plus /></Button>
                  </div>
                  <span className="font-display font-bold">{brl(i.price * i.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <div className="flex justify-between text-lg"><span>Subtotal</span><span className="font-display font-bold">{brl(subtotal)}</span></div>
          <p className="mt-2 text-sm text-muted-foreground">
            {missing > 0 ? `Faltam ${brl(missing)} para frete grátis.` : "🎉 Você ganhou frete grátis!"}
          </p>
          <Button asChild size="lg" className="mt-5 w-full"><Link to="/checkout">Finalizar compra</Link></Button>
          <Button asChild variant="ghost" className="mt-2 w-full"><Link to="/catalogo">Continuar comprando</Link></Button>
        </aside>
      </div>
    </div>
  );
}
