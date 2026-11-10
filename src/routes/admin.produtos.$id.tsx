import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { categoriesQuery } from "@/lib/api";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/admin/produtos/$id")({ component: ProductForm });

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

function ProductForm() {
  const { id } = Route.useParams();
  const isNew = id === "novo";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const cats = useQuery(categoriesQuery);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ name: "", slug: "", description: "", price: "", category_id: "", stock: "0", images: [] as string[], active: true, featured: false });

  const existing = useQuery({
    queryKey: ["admin-product", id], enabled: !isNew,
    queryFn: async () => (await supabase.from("products").select("*").eq("id", id).maybeSingle()).data,
  });
  useEffect(() => {
    const p = existing.data;
    if (p) setF({ name: p.name, slug: p.slug, description: p.description ?? "", price: String(p.price), category_id: p.category_id ?? "", stock: String(p.stock), images: p.images, active: p.active, featured: p.featured });
  }, [existing.data]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast.error(`Falha ao enviar ${file.name}`); continue; }
      const { data } = await supabase.storage.from("product-images").createSignedUrl(path, TEN_YEARS);
      if (data) urls.push(data.signedUrl);
    }
    setF((s) => ({ ...s, images: [...s.images, ...urls] }));
    setUploading(false);
    if (urls.length) toast.success(`${urls.length} imagem(ns) enviada(s)`);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: f.name, slug: f.slug || slugify(f.name), description: f.description,
      price: Number(f.price.replace(",", ".")), category_id: f.category_id || null,
      stock: Math.max(0, parseInt(f.stock) || 0), images: f.images, active: f.active, featured: f.featured,
      updated_at: new Date().toISOString(),
    };
    const { error } = isNew ? await supabase.from("products").insert(payload) : await supabase.from("products").update(payload).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.code === "23505" ? "Já existe um produto com esse endereço (slug)" : "Erro ao salvar produto");
    toast.success(isNew ? "Produto criado" : "Produto atualizado");
    qc.invalidateQueries();
    navigate({ to: "/admin/produtos" });
  };

  if (!isNew && existing.isLoading) return <Skeleton className="h-96 rounded-2xl" />;

  return (
    <form onSubmit={save} className="max-w-3xl">
      <Link to="/admin/produtos" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground"><ChevronLeft className="h-4 w-4" /> Produtos</Link>
      <h1 className="mt-2 text-3xl font-extrabold">{isNew ? "Novo produto" : "Editar produto"}</h1>
      <div className="mt-6 space-y-5 rounded-2xl bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Nome</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value, slug: isNew ? slugify(e.target.value) : f.slug })} /></div>
          <div className="sm:col-span-2"><Label>Endereço na loja (slug)</Label><Input value={f.slug} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} /></div>
          <div className="sm:col-span-2"><Label>Descrição</Label><Textarea rows={5} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div><Label>Preço (R$)</Label><Input required inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="0,00" /></div>
          <div><Label>Estoque</Label><Input required type="number" min={0} value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></div>
          <div className="sm:col-span-2">
            <Label>Categoria</Label>
            <Select value={f.category_id} onValueChange={(v) => setF({ ...f, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{cats.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Imagens</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {f.images.map((src, i) => (
              <div key={src + i} className="relative h-24 w-24 overflow-hidden rounded-xl border border-border">
                <img src={src} alt="" className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-foreground px-1 text-[10px] font-bold text-background">Capa</span>}
                <button type="button" onClick={() => setF({ ...f, images: f.images.filter((_, j) => j !== i) })} className="absolute right-1 top-1 rounded-full bg-background p-1" aria-label="Remover imagem"><X className="h-3 w-3" /></button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()} className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-input text-muted-foreground hover:border-primary hover:text-primary">
              {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
          <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={f.active} onCheckedChange={(v) => setF({ ...f, active: v })} /> Visível na loja</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><Switch checked={f.featured} onCheckedChange={(v) => setF({ ...f, featured: v })} /> Destaque na página inicial</label>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button disabled={saving || uploading}>{saving && <Loader2 className="animate-spin" />}Salvar</Button>
        <Button asChild variant="outline"><Link to="/admin/produtos">Cancelar</Link></Button>
      </div>
    </form>
  );
}
