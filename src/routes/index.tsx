import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Truck, Store, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductGrid } from "@/components/store/ProductCard";
import { categoriesQuery, featuredQuery, newestQuery } from "@/lib/api";
import { CATEGORY_CLASS } from "@/lib/status";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Papelaria Cores — cadernos, canetas e criatividade" },
      { name: "description", content: "Papelaria online com cadernos, canetas, material escolar, escritório e arte. Frete grátis acima de R$ 150." },
      { property: "og:title", content: "Papelaria Cores — papel, cor e criatividade" },
      { property: "og:description", content: "Cadernos, canetas, material escolar e arte com frete grátis acima de R$ 150." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const cats = useQuery(categoriesQuery);
  const featured = useQuery(featuredQuery);
  const newest = useQuery(newestQuery);

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-hero">
          <img src="/images/hero.jpg" alt="Cadernos, lápis e canetas coloridas" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover object-right opacity-90 mix-blend-multiply" />
          <div className="relative max-w-lg px-6 py-14 sm:px-10 sm:py-20">
            <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-bold"><Sparkles className="h-3.5 w-3.5 text-primary" /> Volta às aulas 2027</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] sm:text-6xl">Papel, cor e muita criatividade.</h1>
            <p className="mt-4 text-base font-semibold sm:text-lg">Tudo para estudar, trabalhar e criar — com carinho em cada pacote.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full card-pop"><Link to="/catalogo">Ver catálogo <ArrowRight /></Link></Button>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { I: Truck, t: "Frete grátis", d: "em compras acima de R$ 150" },
            { I: Store, t: "Retire na loja", d: "sem custo, no centro de SP" },
            { I: Sparkles, t: "Pix ou cartão", d: "pague como preferir" },
          ].map(({ I, t, d }) => (
            <div key={t} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <I className="h-6 w-6 text-primary" />
              <div><p className="font-bold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Categorias</h2>
        <div className="scrollbar-none -mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:px-0">
          {cats.isLoading
            ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 min-w-36 rounded-2xl" />)
            : cats.data?.map((c) => (
                <Link key={c.id} to="/catalogo" search={{ categoria: c.slug }} className={`flex min-w-36 flex-col justify-between rounded-2xl p-4 transition hover:-translate-y-1 ${CATEGORY_CLASS[c.color] ?? "bg-muted"}`}>
                  <span className="text-4xl">{c.emoji}</span>
                  <span className="mt-6 font-display text-lg font-bold leading-tight">{c.name}</span>
                </Link>
              ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Destaques</h2>
          <Link to="/catalogo" className="text-sm font-bold text-primary">Ver tudo →</Link>
        </div>
        <div className="mt-5"><ProductGrid products={featured.data} loading={featured.isLoading} /></div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-4">
        <h2 className="text-2xl font-extrabold sm:text-3xl">Novidades</h2>
        <div className="mt-5"><ProductGrid products={newest.data} loading={newest.isLoading} count={4} /></div>
      </section>
    </div>
  );
}
