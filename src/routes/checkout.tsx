import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, QrCode, Store, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressFields, emptyAddress, type Address } from "@/components/store/AddressFields";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { brl } from "@/lib/format";
import { shippingFor, type DeliveryMethod } from "@/lib/shipping";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Finalizar compra — Papelaria Cores" },
      { name: "description", content: "Informe seus dados, entrega e pagamento." },
      { property: "og:title", content: "Finalizar compra — Papelaria Cores" },
      { property: "og:description", content: "Checkout da Papelaria Cores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

function Option({ active, onClick, icon: I, title, desc }: { active: boolean; onClick: () => void; icon: any; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition ${active ? "border-primary bg-coral/40" : "border-border bg-card"}`}>
      <I className="h-6 w-6 text-primary" />
      <div><p className="font-bold">{title}</p><p className="text-sm text-muted-foreground">{desc}</p></div>
    </button>
  );
}

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", cpf: "" });
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [method, setMethod] = useState<DeliveryMethod>("entrega");
  const [payment, setPayment] = useState<"pix" | "cartao">("pix");
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: addrs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).limit(1),
      ]);
      setCustomer((c) => ({ name: prof?.full_name ?? c.name, email: user.email ?? "", phone: prof?.phone ?? c.phone, cpf: prof?.cpf ?? c.cpf }));
      if (addrs?.[0]) setAddress(addrs[0]);
    })();
  }, [user]);

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold">Carrinho vazio</h1>
        <Button asChild className="mt-6"><Link to="/catalogo">Ver produtos</Link></Button>
      </div>
    );

  if (!loading && !user)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-5xl">🔐</p>
        <h1 className="mt-4 text-2xl font-extrabold">Entre para finalizar</h1>
        <p className="mt-2 text-muted-foreground">Seu carrinho fica guardado. Entre ou crie sua conta para acompanhar o pedido.</p>
        <Button asChild className="mt-6"><Link to="/auth" search={{ redirect: "/checkout" }}>Entrar ou cadastrar</Link></Button>
      </div>
    );

  const shipping = shippingFor(subtotal, method);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { data, error } = await supabase.rpc("place_order", {
      _items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      _customer: customer,
      _delivery_method: method,
      _address: method === "entrega" ? (address as any) : null,
      _payment_method: payment,
    });
    setSending(false);
    if (error) return toast.error(error.message || "Não foi possível finalizar");
    clear();
    qc.invalidateQueries({ queryKey: ["products"] });
    toast.success("Pedido realizado! 🎉");
    navigate({ to: "/conta/pedidos/$id", params: { id: data as string } });
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Finalizar compra</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">1. Seus dados</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Nome completo</Label><Input required value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input required type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} /></div>
              <div><Label>Telefone</Label><Input required value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="(11) 90000-0000" /></div>
              <div><Label>CPF</Label><Input value={customer.cpf} onChange={(e) => setCustomer({ ...customer, cpf: e.target.value })} placeholder="000.000.000-00" /></div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">2. Entrega</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Option active={method === "entrega"} onClick={() => setMethod("entrega")} icon={Truck} title="Receber em casa" desc={subtotal >= 150 ? "Frete grátis" : "R$ 15,00 · grátis acima de R$ 150"} />
              <Option active={method === "retirada"} onClick={() => setMethod("retirada")} icon={Store} title="Retirar na loja" desc="Grátis · Rua das Flores, 123" />
            </div>
            {method === "entrega" && <div className="mt-5"><AddressFields value={address} onChange={setAddress} /></div>}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">3. Pagamento</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Option active={payment === "pix"} onClick={() => setPayment("pix")} icon={QrCode} title="Pix" desc="Aprovação imediata" />
              <Option active={payment === "cartao"} onClick={() => setPayment("cartao")} icon={CreditCard} title="Cartão de crédito" desc="Em até 3x sem juros" />
            </div>
            {payment === "pix" ? (
              <p className="mt-4 rounded-xl bg-mint p-4 text-sm text-mint-ink">O QR Code Pix será exibido após confirmar o pedido.</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label>Número do cartão</Label><Input required inputMode="numeric" placeholder="0000 0000 0000 0000" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ") })} /></div>
                <div className="col-span-2"><Label>Nome impresso</Label><Input required value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} /></div>
                <div><Label>Validade</Label><Input required placeholder="MM/AA" value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} /></div>
                <div><Label>CVV</Label><Input required inputMode="numeric" maxLength={4} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} /></div>
                <p className="col-span-2 text-xs text-muted-foreground">Demonstração: nenhum valor é cobrado.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold">Resumo do pedido</h2>
          <ul className="space-y-3">
            {items.map((i) => (
              <li key={i.product_id} className="flex items-center gap-3 text-sm">
                <img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <span className="flex-1">{i.quantity}x {i.name}</span>
                <span className="font-bold">{brl(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
            <div className="flex justify-between"><span>Frete</span><span>{shipping === 0 ? "Grátis" : brl(shipping)}</span></div>
            <div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span className="font-display">{brl(subtotal + shipping)}</span></div>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            {sending && <Loader2 className="animate-spin" />} Confirmar pedido
          </Button>
        </aside>
      </div>
    </form>
  );
}
