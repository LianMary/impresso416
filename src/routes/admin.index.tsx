import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, DollarSign, Package, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/store/StatusBadge";
import { brl, dateBR } from "@/lib/format";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const [orders, low, recent] = await Promise.all([
        supabase.from("orders").select("total, status"),
        supabase.from("products").select("id, name, stock").lte("stock", 5).order("stock"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(6),
      ]);
      const valid = (orders.data ?? []).filter((o) => o.status !== "cancelado");
      return {
        total: valid.reduce((a, o) => a + Number(o.total), 0),
        count: orders.data?.length ?? 0,
        low: low.data ?? [],
        recent: recent.data ?? [],
      };
    },
  });

  const cards = [
    { label: "Total em vendas", value: data && brl(data.total), icon: DollarSign, cls: "bg-mint text-mint-ink" },
    { label: "Pedidos", value: data?.count, icon: ShoppingCart, cls: "bg-sky text-sky-ink" },
    { label: "Estoque baixo", value: data?.low.length, icon: AlertTriangle, cls: "bg-sun text-sun-ink" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Painel</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-card p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${c.cls}`}><c.icon className="h-5 w-5" /></div>
            <p className="mt-3 text-sm text-muted-foreground">{c.label}</p>
            {isLoading ? <Skeleton className="mt-1 h-8 w-24" /> : <p className="font-display text-3xl font-extrabold">{c.value}</p>}
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl bg-card p-5">
          <div className="flex justify-between"><h2 className="font-bold">Pedidos recentes</h2><Link to="/admin/pedidos" className="text-sm font-bold text-primary">Ver todos</Link></div>
          <div className="mt-3 divide-y divide-border">
            {isLoading && <Skeleton className="h-40" />}
            {data?.recent.length === 0 && <p className="py-6 text-sm text-muted-foreground">Nenhum pedido ainda.</p>}
            {data?.recent.map((o) => (
              <Link key={o.id} to="/admin/pedidos/$id" params={{ id: o.id }} className="flex items-center gap-3 py-3 text-sm hover:bg-muted/50">
                <div className="flex-1"><p className="font-bold">#{o.code} · {o.customer_name}</p><p className="text-muted-foreground">{dateBR(o.created_at)}</p></div>
                <StatusBadge status={o.status} />
                <span className="w-24 text-right font-bold">{brl(o.total)}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-5">
          <h2 className="font-bold">Estoque baixo (≤ 5)</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {data?.low.length === 0 && <li className="text-muted-foreground">Tudo em ordem 🎉</li>}
            {data?.low.map((p) => (
              <li key={p.id}>
                <Link to="/admin/produtos/$id" params={{ id: p.id }} className="flex items-center justify-between gap-2 rounded-lg p-2 hover:bg-muted">
                  <span className="flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" />{p.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${p.stock === 0 ? "bg-destructive text-destructive-foreground" : "bg-sun text-sun-ink"}`}>{p.stock}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
