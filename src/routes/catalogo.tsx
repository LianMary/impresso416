import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProductGrid } from "@/components/store/ProductCard";
import { categoriesQuery, productsQuery } from "@/lib/api";

type S = { q?: string; categoria?: string; ordem?: string };

export const Route = createFileRoute("/catalogo")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s.q === "string" ? s.q : undefined,
    categoria: typeof s.categoria === "string" ? s.categoria : undefined,
    ordem: typeof s.ordem === "string" ? s.ordem : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Catálogo — Papelaria Cores" },
      { name: "description", content: "Explore cadernos, canetas, material escolar, escritório e arte e artesanato." },
      { property: "og:title", content: "Catálogo — Papelaria Cores" },
      { property: "og:description", content: "Todos os produtos da Papelaria Cores em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/catalogo" });
  const [q, setQ] = useState(search.q ?? "");
  const cats = useQuery(categoriesQuery);
  const products = useQuery(productsQuery(search));

  useEffect(() => setQ(search.q ?? ""), [search.q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.q ?? "") !== q) navigate({ search: (s: S) => ({ ...s, q: q || undefined }), replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const current = cats.data?.find((c) => c.slug === search.categoria);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{current ? `${current.emoji} ${current.name}` : "Catálogo"}</h1>
      <p className="mt-1 text-muted-foreground">{current?.description ?? "Tudo o que você precisa para criar e organizar."}</p>

      <div className="scrollbar-none -mx-4 mt-6 flex gap-2 overflow-x-auto px-4">
        <Link to="/catalogo" search={(s: S) => ({ ...s, categoria: undefined })} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${!search.categoria ? "border-foreground bg-foreground text-background" : "border-border bg-card"}`}>Todos</Link>
        {cats.data?.map((c) => (
          <Link key={c.id} to="/catalogo" search={(s: S) => ({ ...s, categoria: c.slug })} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold ${search.categoria === c.slug ? "border-foreground bg-foreground text-background" : "border-border bg-card"}`}>
            {c.emoji} {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-11 pl-9" placeholder="Buscar por nome..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={search.ordem ?? "relevancia"} onValueChange={(v) => navigate({ search: (s: S) => ({ ...s, ordem: v === "relevancia" ? undefined : v }) })}>
          <SelectTrigger className="h-11 sm:w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="relevancia">Mais relevantes</SelectItem>
            <SelectItem value="menor">Menor preço</SelectItem>
            <SelectItem value="maior">Maior preço</SelectItem>
            <SelectItem value="novos">Mais recentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        {products.isError ? (
          <p className="rounded-xl bg-muted p-6 text-center">Não foi possível carregar os produtos.</p>
        ) : !products.isLoading && products.data?.length === 0 ? (
          <div className="rounded-2xl bg-muted p-10 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-2 font-bold">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground">Tente outra busca ou categoria.</p>
          </div>
        ) : (
          <>
            {products.data && <p className="mb-3 text-sm text-muted-foreground">{products.data.length} produto(s)</p>}
            <ProductGrid products={products.data} loading={products.isLoading} />
          </>
        )}
      </div>
    </div>
  );
}
