import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Minus, Plus, ShoppingBag, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { productQuery } from "@/lib/api";
import { brl } from "@/lib/format";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/produto/$slug")({
  head: () => ({
    meta: [
      { title: "Produto — Impresso416" },
      { name: "description", content: "Detalhes, fotos e estoque do produto na Impresso416." },
      { property: "og:title", content: "Produto — Impresso416" },
      { property: "og:description", content: "Veja fotos, descrição e preço." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: p, isLoading } = useQuery(productQuery(slug));
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const cart = useCart();

  if (isLoading)
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="space-y-4"><Skeleton className="h-8 w-3/4" /><Skeleton className="h-10 w-1/3" /><Skeleton className="h-24" /></div>
      </div>
    );

  if (!p)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Produto não encontrado</h1>
        <Button asChild className="mt-6"><Link to="/catalogo">Voltar ao catálogo</Link></Button>
      </div>
    );

  const out = p.stock <= 0;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Link to="/catalogo" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ChevronLeft className="h-4 w-4" /> Catálogo</Link>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl bg-muted">
            {p.images[img] && <img src={p.images[img]} alt={p.name} width={800} height={800} className="h-full w-full object-cover" />}
          </div>
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {p.images.map((src, i) => (
                <button key={i} onClick={() => setImg(i)} className={`h-20 w-20 overflow-hidden rounded-xl border-2 ${i === img ? "border-primary" : "border-transparent"}`}>
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          {p.categories && (
            <Link to="/catalogo" search={{ categoria: p.categories.slug }} className="text-sm font-bold uppercase tracking-wide text-primary">{p.categories.name}</Link>
          )}
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{p.name}</h1>
          <p className="mt-4 font-display text-4xl font-extrabold">{brl(p.price)}</p>
          <p className="mt-2 text-sm">
            {out ? <span className="font-bold text-destructive">Indisponível no momento</span>
              : p.stock <= 5 ? <span className="font-bold text-coral-ink">Últimas {p.stock} unidades!</span>
              : <span className="text-muted-foreground">{p.stock} em estoque</span>}
          </p>
          <p className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">{p.description}</p>

          {!out && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="flex h-12 items-center justify-between rounded-xl border border-input bg-card sm:w-36">
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir"><Minus /></Button>
                <span className="font-bold">{qty}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(p.stock, q + 1))} aria-label="Aumentar"><Plus /></Button>
              </div>
              <Button size="lg" className="h-12 flex-1 rounded-xl text-base" onClick={() => {
                cart.add({ product_id: p.id, slug: p.slug, name: p.name, price: Number(p.price), image: p.images[0], stock: p.stock }, qty);
                toast.success(`${qty}x ${p.name} no carrinho`);
              }}>
                <ShoppingBag /> Adicionar ao carrinho
              </Button>
            </div>
          )}
          {out && <Button size="lg" disabled className="mt-8 h-12 w-full">Indisponível</Button>}
        </div>
      </div>
    </div>
  );
}
