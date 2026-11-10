import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { brl } from "@/lib/format";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/api";

export function ProductCard({ p }: { p: Product }) {
  const cart = useCart();
  const out = p.stock <= 0;
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-soft">
      <Link to="/produto/$slug" params={{ slug: p.slug }} className="relative block aspect-square overflow-hidden bg-muted">
        {p.images[0] && (
          <img src={p.images[0]} alt={p.name} loading="lazy" width={600} height={600} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
        {out && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-ink-foreground">Indisponível</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
        {p.categories && <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.categories.name}</span>}
        <Link to="/produto/$slug" params={{ slug: p.slug }} className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">
          {p.name}
        </Link>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="font-display text-lg font-bold text-primary">{brl(p.price)}</span>
          <Button
            size="icon"
            variant={out ? "outline" : "default"}
            disabled={out}
            aria-label="Adicionar ao carrinho"
            onClick={() => {
              cart.add({ product_id: p.id, slug: p.slug, name: p.name, price: Number(p.price), image: p.images[0], stock: p.stock });
              toast.success("Adicionado ao carrinho", { description: p.name });
            }}
          >
            <ShoppingBag />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    </div>
  );
}

export function ProductGrid({ products, loading, count = 8 }: { products?: Product[]; loading?: boolean; count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {loading
        ? Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)
        : products?.map((p) => <ProductCard key={p.id} p={p} />)}
    </div>
  );
}
