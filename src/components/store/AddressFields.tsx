import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Address = {
  cep: string; street: string; number: string; complement?: string | null;
  neighborhood: string; city: string; state: string;
};
export const emptyAddress: Address = { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "" };

export const maskCep = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

export function AddressFields({ value, onChange }: { value: Address; onChange: (a: Address) => void }) {
  const [loading, setLoading] = useState(false);
  const set = (k: keyof Address, v: string) => onChange({ ...value, [k]: v });

  const lookup = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await r.json();
      if (d.erro) throw new Error();
      onChange({ ...value, cep: maskCep(digits), street: d.logradouro || value.street, neighborhood: d.bairro || value.neighborhood, city: d.localidade, state: d.uf });
    } catch {
      toast.error("CEP não encontrado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-6 gap-3">
      <div className="col-span-6 sm:col-span-2">
        <Label>CEP</Label>
        <div className="relative">
          <Input required inputMode="numeric" placeholder="00000-000" value={value.cep}
            onChange={(e) => { const v = maskCep(e.target.value); set("cep", v); if (v.length === 9) lookup(v); }} />
          {loading && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin" />}
        </div>
      </div>
      <div className="col-span-6 sm:col-span-4"><Label>Rua</Label><Input required value={value.street} onChange={(e) => set("street", e.target.value)} /></div>
      <div className="col-span-2"><Label>Número</Label><Input required value={value.number} onChange={(e) => set("number", e.target.value)} /></div>
      <div className="col-span-4"><Label>Complemento</Label><Input value={value.complement ?? ""} onChange={(e) => set("complement", e.target.value)} /></div>
      <div className="col-span-6 sm:col-span-3"><Label>Bairro</Label><Input required value={value.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} /></div>
      <div className="col-span-4 sm:col-span-2"><Label>Cidade</Label><Input required value={value.city} onChange={(e) => set("city", e.target.value)} /></div>
      <div className="col-span-2 sm:col-span-1"><Label>UF</Label><Input required maxLength={2} value={value.state} onChange={(e) => set("state", e.target.value.toUpperCase())} /></div>
    </div>
  );
}
