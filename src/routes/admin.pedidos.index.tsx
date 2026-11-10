import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/store/StatusBadge";
import { ORDER_STATUSES, STATUS_LABEL } from "@/lib/status";
import { brl, dateBR } from "@/lib/format";

export const Route = createFileRoute("/admin/pedidos/")({ component: AdminOrders });

function AdminOrders() {
  const [status, setStatus] = useState<string>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: async () => {
      let q = supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status as any);
      return (await q).data ?? [];
    },
  });
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Pedidos</h1>
      <div className="scrollbar-none mt-5 flex gap-2 overflow-x-auto">
        {["all", ...ORDER_STATUSES].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${status === s ? "bg-foreground text-background" : "bg-card"}`}>
            {s === "all" ? "Todos" : STATUS_LABEL[s as keyof typeof STATUS_LABEL]}
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Data</TableHead><TableHead>Entrega</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6}><Skeleton className="h-24" /></TableCell></TableRow>}
            {data?.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum pedido</TableCell></TableRow>}
            {data?.map((o) => (
              <TableRow key={o.id} className="cursor-pointer">
                <TableCell><Link to="/admin/pedidos/$id" params={{ id: o.id }} className="font-bold text-primary">#{o.code}</Link></TableCell>
                <TableCell className="min-w-40">{o.customer_name}</TableCell>
                <TableCell className="whitespace-nowrap">{dateBR(o.created_at)}</TableCell>
                <TableCell>{o.delivery_method === "retirada" ? "Retirada" : "Entrega"}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                <TableCell className="text-right font-bold">{brl(o.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
