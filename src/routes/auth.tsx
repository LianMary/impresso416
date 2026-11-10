import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleButton } from "@/components/store/GoogleButton";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === "string" && s.redirect.startsWith("/") && !s.redirect.startsWith("//") ? s.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar ou cadastrar — Impresso416" },
      { name: "description", content: "Acesse sua conta da Impresso416." },
      { property: "og:title", content: "Entrar — Impresso416" },
      { property: "og:description", content: "Acesse sua conta da Impresso416." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (user) navigate({ to: redirect ?? "/conta", replace: true });
  }, [user]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    setBusy(false);
    if (error) toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos" : error.message);
    else toast.success("Bem-vindo(a) de volta!");
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { emailRedirectTo: window.location.origin, data: { full_name: form.name } },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Conta criada! Confira seu e-mail para confirmar o cadastro.");
  };

  const forgot = async () => {
    if (!form.email) return toast.error("Digite seu e-mail primeiro");
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message);
    else toast.success("Enviamos um link para redefinir sua senha.");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h1 className="text-center text-3xl font-extrabold">Olá! 👋</h1>
        <p className="mt-1 text-center text-muted-foreground">Entre ou crie sua conta</p>
        <div className="mt-6"><GoogleButton /></div>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
        <Tabs defaultValue="entrar">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="entrar">Entrar</TabsTrigger>
            <TabsTrigger value="cadastrar">Cadastrar</TabsTrigger>
          </TabsList>
          <TabsContent value="entrar">
            <form onSubmit={signIn} className="mt-4 space-y-3">
              <div><Label>E-mail</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Senha</Label><Input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <Button className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Entrar</Button>
              <button type="button" onClick={forgot} className="w-full text-center text-sm font-semibold text-primary">Esqueci minha senha</button>
            </form>
          </TabsContent>
          <TabsContent value="cadastrar">
            <form onSubmit={signUp} className="mt-4 space-y-3">
              <div><Label>Nome</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Senha</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <Button className="w-full" disabled={busy}>{busy && <Loader2 className="animate-spin" />}Criar conta</Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground"><Link to="/catalogo">← Voltar às compras</Link></p>
    </div>
  );
}
