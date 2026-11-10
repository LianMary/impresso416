import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AccountNav } from "@/components/store/AccountNav";
import { StatusBadge } from "@/components/store/StatusBadge";
import { brl, dateBR } from "@/lib/format";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/conta/pedidos/")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — Papelaria Cores" },
      { name: "description", content: "Acompanhe o histórico e o status dos seus pedidos." },
      { property: "og:title", content: "Meus pedidos — Papelaria Cores" },
      { property: "og:description", content: "Histórico de pedidos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Orders,
});

function Orders() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("orders").select("*, order_items(id)").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Meus pedidos</h1>
      <div className="mt-5"><AccountNav /></div>
      <div className="mt-6 space-y-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        {data?.length === 0 && (
          <div className="rounded-2xl bg-muted p-10 text-center">
            <p className="font-bold">Você ainda não fez pedidos</p>
            <Button asChild className="mt-4"><Link to="/catalogo">Começar a comprar</Link></Button>
          </div>
        )}
        {data?.map((o) => (
          <Link key={o.id} to="/conta/pedidos/$id" params={{ id: o.id }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:shadow-soft">
            <div className="flex-1">
              <p className="font-display font-bold">Pedido #{o.code}</p>
              <p className="text-sm text-muted-foreground">{dateBR(o.created_at)} · {o.order_items.length} item(ns)</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge status={o.status} />
              <span className="font-bold">{brl(o.total)}</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
