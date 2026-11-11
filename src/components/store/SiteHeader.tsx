import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { categoriesQuery } from "@/lib/api";
import logoMarkUrl from "@/assets/logo-mark.png";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="Impresso416 — início">
      <img src={logoMarkUrl} alt="" width={500} height={500} className="h-9 w-9 rotate-[-4deg]" />
      <span className="font-display text-xl font-extrabold leading-none">
        Impresso<span className="text-primary">416</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const { count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { data: cats } = useQuery(categoriesQuery);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
    navigate({ to: "/catalogo", search: { q: q || undefined } });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu"><Menu /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetTitle className="font-display">Menu</SheetTitle>
            <form onSubmit={submit} className="mt-4">
              <Input placeholder="Buscar produtos..." value={q} onChange={(e) => setQ(e.target.value)} />
            </form>
            <nav className="mt-6 flex flex-col gap-1">
              <Link to="/catalogo" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-semibold hover:bg-muted">Todos os produtos</Link>
              {cats?.map((c) => (
                <Link key={c.id} to="/catalogo" search={{ categoria: c.slug }} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 hover:bg-muted">
                  {c.emoji} {c.name}
                </Link>
              ))}
              <Link to={user ? "/conta" : "/auth"} onClick={() => setOpen(false)} className="mt-4 rounded-lg px-3 py-2 font-semibold hover:bg-muted">
                {user ? "Minha conta" : "Entrar / Cadastrar"}
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Logo />

        <nav className="ml-6 hidden items-center gap-5 text-sm font-semibold md:flex">
          <Link to="/catalogo" className="hover:text-primary" activeProps={{ className: "text-primary" }}>Catálogo</Link>
          {cats?.slice(0, 3).map((c) => (
            <Link key={c.id} to="/catalogo" search={{ categoria: c.slug }} className="hover:text-primary">{c.name}</Link>
          ))}
        </nav>

        <form onSubmit={submit} className="relative ml-auto hidden w-64 lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="rounded-full pl-9" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
        </form>

        <div className="ml-auto flex items-center gap-1 lg:ml-2">
          <Button asChild variant="ghost" size="icon" aria-label="Minha conta">
            <Link to={user ? "/conta" : "/auth"}><User /></Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="relative" aria-label="Carrinho">
            <Link to="/carrinho">
              <ShoppingBag />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">{count}</span>
              )}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
