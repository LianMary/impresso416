import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { categoriesQuery, type Category } from "@/lib/api";
import { CATEGORY_CLASS, CATEGORY_COLORS } from "@/lib/status";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/admin/categorias")({ component: Categories });

type Form = Partial<Category> & { name: string };

function Categories() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(categoriesQuery);
  const [edit, setEdit] = useState<Form | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    const payload = { name: edit.name, slug: edit.slug || slugify(edit.name), description: edit.description ?? null, emoji: edit.emoji ?? null, color: edit.color ?? "coral", sort_order: edit.sort_order ?? (data?.length ?? 0) + 1 };
    const { error } = edit.id ? await supabase.from("categories").update(payload).eq("id", edit.id) : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.code === "23505" ? "Já existe uma categoria com esse nome" : "Erro ao salvar");
    toast.success("Categoria salva");
    setEdit(null);
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const remove = async (c: Category) => {
    if (!confirm(`Excluir a categoria "${c.name}"? Os produtos ficarão sem categoria.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Categoria excluída");
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Categorias</h1>
        <Button onClick={() => setEdit({ name: "", color: "coral" })}><Plus /> Nova</Button>
      </div>
      <div className="mt-6 space-y-2">
        {isLoading && <Skeleton className="h-40 rounded-2xl" />}
        {data?.map((c) => (
          <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
            <span className={`grid h-11 w-11 place-items-center rounded-xl text-xl ${CATEGORY_CLASS[c.color] ?? "bg-muted"}`}>{c.emoji}</span>
            <div className="flex-1"><p className="font-bold">{c.name}</p><p className="text-sm text-muted-foreground">{c.description}</p></div>
            <Button variant="ghost" size="icon" onClick={() => setEdit(c)} aria-label="Editar"><Pencil /></Button>
            <Button variant="ghost" size="icon" onClick={() => remove(c)} aria-label="Excluir"><Trash2 /></Button>
          </div>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Editar categoria" : "Nova categoria"}</DialogTitle></DialogHeader>
          {edit && (
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-[80px_1fr] gap-3">
                <div><Label>Emoji</Label><Input value={edit.emoji ?? ""} onChange={(e) => setEdit({ ...edit, emoji: e.target.value })} /></div>
                <div><Label>Nome</Label><Input required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value, slug: edit.id ? edit.slug : slugify(e.target.value) })} /></div>
              </div>
              <div><Label>Descrição</Label><Input value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
              <div>
                <Label>Cor</Label>
                <div className="mt-1 flex gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button key={c} type="button" onClick={() => setEdit({ ...edit, color: c })} className={`h-9 w-9 rounded-full border-2 ${CATEGORY_CLASS[c]} ${edit.color === c ? "border-foreground" : "border-transparent"}`} aria-label={c} />
                  ))}
                </div>
              </div>
              <Button className="w-full">Salvar</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
