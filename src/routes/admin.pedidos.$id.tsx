import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrderDetail } from "@/components/store/OrderDetail";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/status";

export const Route = createFileRoute("/admin/pedidos/$id")({ component: AdminOrder });

function AdminOrder() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle()).data,
  });
  const change = async (status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar status");
    toast.success(`Status alterado para "${STATUS_LABEL[status]}"`);
    qc.invalidateQueries();
  };
  return (
    <div className="max-w-5xl">
      <Link to="/admin/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ChevronLeft className="h-4 w-4" /> Pedidos</Link>
      {isLoading ? <Skeleton className="mt-4 h-80" /> : !data ? <p className="mt-4">Pedido não encontrado.</p> : (
        <>
          <div className="mb-5 mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-extrabold">Pedido #{data.code}</h1>
            <Select value={data.status} onValueChange={(v) => change(v as OrderStatus)}>
              <SelectTrigger className="w-56 bg-card"><SelectValue /></SelectTrigger>
              <SelectContent>{ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <OrderDetail order={data} />
        </>
      )}
    </div>
  );
}
