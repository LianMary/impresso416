import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FolderTree, LayoutDashboard, LogOut, Package, ShoppingCart, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkAdmin } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/admin/login") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user || !(await checkAdmin(data.user.id))) throw redirect({ to: "/admin/login" });
  },
  head: () => ({ meta: [{ title: "Admin — Papelaria Cores" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
] as const;

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const qc = useQueryClient();
  if (pathname === "/admin/login") return <Outlet />;

  const out = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-muted md:flex">
      <aside className="sticky top-0 z-30 bg-sidebar text-sidebar-foreground md:h-screen md:w-60 md:shrink-0">
        <div className="flex items-center justify-between px-4 py-3 md:block md:py-6">
          <p className="font-display text-lg font-extrabold">Cores <span className="text-sidebar-primary">Admin</span></p>
          <div className="flex gap-1 md:hidden">
            <Link to="/" className="rounded-lg p-2 hover:bg-sidebar-accent" aria-label="Loja"><Store className="h-5 w-5" /></Link>
            <button onClick={out} className="rounded-lg p-2 hover:bg-sidebar-accent" aria-label="Sair"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 hidden w-60 space-y-1 px-3 md:block">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"><Store className="h-4 w-4" /> Ver loja</Link>
          <button onClick={out} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"><LogOut className="h-4 w-4" /> Sair</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8"><Outlet /></main>
    </div>
  );
}
