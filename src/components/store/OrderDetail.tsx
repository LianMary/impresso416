import { brl, dateBR } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

export function OrderDetail({ order }: { order: any }) {
  const a = order.address;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Itens</h2>
          <StatusBadge status={order.status} />
        </div>
        <ul className="mt-4 divide-y divide-border">
          {order.order_items.map((i: any) => (
            <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
              {i.product_image && <img src={i.product_image} alt="" className="h-14 w-14 rounded-lg object-cover" />}
              <span className="flex-1"><b>{i.quantity}x</b> {i.product_name}<br /><span className="text-muted-foreground">{brl(i.unit_price)} cada</span></span>
              <span className="font-bold">{brl(i.unit_price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{brl(order.subtotal)}</span></div>
          <div className="flex justify-between"><span>Frete</span><span>{Number(order.shipping) === 0 ? "Grátis" : brl(order.shipping)}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{brl(order.total)}</span></div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <h3 className="font-bold">Cliente</h3>
          <p className="mt-2">{order.customer_name}<br />{order.customer_email}<br />{order.customer_phone}{order.customer_cpf && <><br />CPF {order.customer_cpf}</>}</p>
          <p className="mt-2 text-muted-foreground">Feito em {dateBR(order.created_at)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <h3 className="font-bold">{order.delivery_method === "retirada" ? "Retirada na loja" : "Entrega"}</h3>
          {a ? <p className="mt-2">{a.street}, {a.number}{a.complement ? ` — ${a.complement}` : ""}<br />{a.neighborhood}, {a.city}/{a.state}<br />CEP {a.cep}</p>
             : <p className="mt-2">Rua das Flores, 123 — Centro, São Paulo/SP</p>}
          <h3 className="mt-4 font-bold">Pagamento</h3>
          <p className="mt-1">{order.payment_method === "pix" ? "Pix" : "Cartão de crédito"}</p>
        </div>
      </div>
    </div>
  );
}
