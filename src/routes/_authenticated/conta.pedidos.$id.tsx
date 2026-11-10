import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderDetail } from "@/components/store/OrderDetail";

export const Route = createFileRoute("/_authenticated/conta/pedidos/$id")({
  head: () => ({
    meta: [
      { title: "Detalhes do pedido — Papelaria Cores" },
      { name: "description", content: "Status e itens do seu pedido." },
      { property: "og:title", content: "Pedido — Papelaria Cores" },
      { property: "og:description", content: "Status e itens do seu pedido." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderPage,
});

function PixBox({ code, total }: { code: string; total: string }) {
  const pix = `00020126580014BR.GOV.BCB.PIX0136papelariacores-${code}5204000053039865406${total}5802BR5915PAPELARIA CORES6009SAO PAULO`;
  const cells = Array.from({ length: 21 * 21 }, (_, i) => ((i * 7 + code.charCodeAt(i % code.length) * 13) % 5) < 2);
  return (
    <div className="mb-4 flex flex-col items-center gap-4 rounded-2xl bg-mint p-5 text-mint-ink sm:flex-row">
      <div className="grid h-36 w-36 shrink-0 grid-cols-[repeat(21,1fr)] rounded-lg bg-card p-2">
        {cells.map((on, i) => <span key={i} className={on ? "bg-foreground" : ""} />)}
      </div>
      <div className="flex-1">
        <p className="font-display text-lg font-bold">Pague com Pix para confirmar</p>
        <p className="text-sm">Escaneie o QR Code ou copie o código abaixo. (Demonstração — nenhum valor é cobrado.)</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => { navigator.clipboard.writeText(pix); toast.success("Código Pix copiado"); }}>
          <Copy /> Copiar código Pix
        </Button>
      </div>
    </div>
  );
}

function OrderPage() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle()).data,
  });
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/conta/pedidos" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ChevronLeft className="h-4 w-4" /> Meus pedidos</Link>
      {isLoading ? <Skeleton className="mt-4 h-80 rounded-2xl" /> : !data ? <p className="mt-6">Pedido não encontrado.</p> : (
        <>
          <h1 className="mb-5 mt-3 text-3xl font-extrabold">Pedido #{data.code}</h1>
          {data.payment_method === "pix" && data.status === "aguardando_pagamento" && <PixBox code={data.code} total={String(data.total)} />}
          <OrderDetail order={data} />
        </>
      )}
    </div>
  );
}
