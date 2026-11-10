import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { categoriesQuery } from "@/lib/api";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/admin/produtos/")({ component: AdminProducts });

function AdminProducts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [del, setDel] = useState<{ id: string; name: string } | null>(null);
  const cats = useQuery(categoriesQuery);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false })).data ?? [],
  });

  const rows = data?.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) &&
    (cat === "all" || p.category_id === cat) &&
    (status === "all" || (status === "active" ? p.active : status === "inactive" ? !p.active : p.stock <= 5)),
  );

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("products").update({ active }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success(active ? "Produto visível na loja" : "Produto ocultado");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const remove = async () => {
    if (!del) return;
    const { error } = await supabase.from("products").delete().eq("id", del.id);
    setDel(null);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Produto excluído");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Produtos</h1>
        <Button asChild><Link to="/admin/produtos/$id" params={{ id: "novo" }}><Plus /> Novo produto</Link></Button>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="bg-card pl-9" placeholder="Buscar produto..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="bg-card sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todas categorias</SelectItem>{cats.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="bg-card sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem><SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem><SelectItem value="low">Estoque baixo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead>Preço</TableHead><TableHead>Estoque</TableHead><TableHead>Visível</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6}><Skeleton className="h-24" /></TableCell></TableRow>}
            {rows?.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum produto encontrado</TableCell></TableRow>}
            {rows?.map((p) => (
              <TableRow key={p.id}>
                <TableCell><div className="flex min-w-48 items-center gap-3">{p.images[0] ? <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-muted" />}<span className="font-semibold">{p.name}</span></div></TableCell>
                <TableCell>{p.categories?.name ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap">{brl(p.price)}</TableCell>
                <TableCell><span className={p.stock <= 5 ? "font-bold text-destructive" : ""}>{p.stock}</span></TableCell>
                <TableCell><Switch checked={p.active} onCheckedChange={(v) => toggle(p.id, v)} /></TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="icon"><Link to="/admin/produtos/$id" params={{ id: p.id }} aria-label="Editar"><Pencil /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDel({ id: p.id, name: p.name })} aria-label="Excluir"><Trash2 /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir produto?</AlertDialogTitle><AlertDialogDescription>"{del?.name}" será removido permanentemente.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={remove}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
