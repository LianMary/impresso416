import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Package, User, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function AccountNav() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const out = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  const cls = "flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold";
  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto">
      <Link to="/conta" activeOptions={{ exact: true }} className={cls} activeProps={{ className: "!bg-foreground !text-background" }}><User className="h-4 w-4" /> Meus dados</Link>
      <Link to="/conta/pedidos" className={cls} activeProps={{ className: "!bg-foreground !text-background" }}><Package className="h-4 w-4" /> Meus pedidos</Link>
      {isAdmin && <Link to="/admin" className={cls}><LayoutDashboard className="h-4 w-4" /> Painel admin</Link>}
      <Button variant="ghost" className="ml-auto rounded-full" onClick={out}><LogOut /> Sair</Button>
    </div>
  );
}
