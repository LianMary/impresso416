import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Papelaria Cores" },
      { name: "description", content: "Defina uma nova senha para sua conta." },
      { property: "og:title", content: "Nova senha — Papelaria Cores" },
      { property: "og:description", content: "Defina uma nova senha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada!");
    navigate({ to: "/conta" });
  };
  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 px-4 py-16">
      <h1 className="text-3xl font-extrabold">Definir nova senha</h1>
      <div><Label>Nova senha</Label><Input type="password" minLength={6} required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <Button className="w-full">Salvar senha</Button>
    </form>
  );
}
