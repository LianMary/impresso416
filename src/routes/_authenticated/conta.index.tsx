import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AccountNav } from "@/components/store/AccountNav";
import { AddressFields, emptyAddress, type Address } from "@/components/store/AddressFields";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/conta/")({
  head: () => ({
    meta: [
      { title: "Minha conta — Papelaria Cores" },
      { name: "description", content: "Gerencie seus dados e endereços." },
      { property: "og:title", content: "Minha conta — Papelaria Cores" },
      { property: "og:description", content: "Gerencie seus dados e endereços." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Account,
});

type Addr = Address & { id?: string; label: string; is_default?: boolean };

function Account() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;
  const profile = useQuery({
    queryKey: ["profile", uid], enabled: !!uid,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", uid!).maybeSingle()).data,
  });
  const addresses = useQuery({
    queryKey: ["addresses", uid], enabled: !!uid,
    queryFn: async () => (await supabase.from("addresses").select("*").eq("user_id", uid!).order("created_at")).data ?? [],
  });
  const [form, setForm] = useState({ full_name: "", phone: "", cpf: "" });
  const [editing, setEditing] = useState<Addr | null>(null);

  useEffect(() => {
    if (profile.data) setForm({ full_name: profile.data.full_name ?? "", phone: profile.data.phone ?? "", cpf: profile.data.cpf ?? "" });
  }, [profile.data]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("profiles").upsert({ id: uid!, ...form, updated_at: new Date().toISOString() });
    if (error) toast.error("Erro ao salvar"); else { toast.success("Dados atualizados"); qc.invalidateQueries({ queryKey: ["profile"] }); }
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { id, ...rest } = editing as any;
    const payload = { ...rest, user_id: uid! };
    delete payload.created_at;
    if (payload.is_default) await supabase.from("addresses").update({ is_default: false }).eq("user_id", uid!);
    const { error } = id ? await supabase.from("addresses").update(payload).eq("id", id) : await supabase.from("addresses").insert(payload);
    if (error) return toast.error("Erro ao salvar endereço");
    toast.success("Endereço salvo");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["addresses"] });
  };

  const remove = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    toast.success("Endereço removido");
    qc.invalidateQueries({ queryKey: ["addresses"] });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Minha conta</h1>
      <p className="text-muted-foreground">{user?.email}</p>
      <div className="mt-5"><AccountNav /></div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold">Dados pessoais</h2>
        {profile.isLoading ? <Skeleton className="mt-4 h-32" /> : (
          <form onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Nome completo</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>CPF</Label><Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} /></div>
            <div className="sm:col-span-2"><Button>Salvar dados</Button></div>
          </form>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Endereços</h2>
          <Button size="sm" variant="outline" onClick={() => setEditing({ ...emptyAddress, label: "Casa", is_default: !addresses.data?.length })}><Plus /> Novo</Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {addresses.isLoading && <Skeleton className="h-28" />}
          {addresses.data?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>}
          {addresses.data?.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-primary" /> {a.label} {a.is_default && <Star className="h-4 w-4 fill-accent text-sun-ink" />}</div>
              <p className="mt-1 text-sm text-muted-foreground">{a.street}, {a.number}{a.complement ? ` — ${a.complement}` : ""}<br />{a.neighborhood}, {a.city}/{a.state} · {a.cep}</p>
              <div className="mt-2 flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(a)}><Pencil /> Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 /> Remover</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Editar endereço" : "Novo endereço"}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={saveAddress} className="space-y-3">
              <div><Label>Apelido</Label><Input required value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Casa, Trabalho..." /></div>
              <AddressFields value={editing} onChange={(a) => setEditing({ ...editing, ...a })} />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!editing.is_default} onChange={(e) => setEditing({ ...editing, is_default: e.target.checked })} /> Endereço principal</label>
              <Button className="w-full">Salvar endereço</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
