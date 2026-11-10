import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, MapPin, Phone, MessageCircle } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-extrabold">Impresso<span className="text-primary">416</span></p>
          <p className="mt-3 text-sm opacity-80">Papel, cor e criatividade para o seu dia a dia desde 2012.</p>
        </div>
        <div>
          <p className="font-display font-bold">Loja</p>
          <ul className="mt-3 space-y-2 text-sm opacity-80">
            <li><Link to="/catalogo">Catálogo</Link></li>
            <li><Link to="/carrinho">Carrinho</Link></li>
            <li><Link to="/conta/pedidos">Meus pedidos</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-display font-bold">Contato</p>
          <ul className="mt-3 space-y-2 text-sm opacity-80">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0" /> Rua das Flores, 123 — Centro, São Paulo/SP</li>
            <li className="flex gap-2"><Phone className="h-4 w-4" /> (11) 3456-7890</li>
            <li className="flex gap-2"><Mail className="h-4 w-4" /> contato@impresso416.com.br</li>
            <li>Seg a Sáb, 9h às 19h</li>
          </ul>
        </div>
        <div>
          <p className="font-display font-bold">Redes sociais</p>
          <div className="mt-3 flex gap-3">
            {[Instagram, Facebook, MessageCircle].map((I, i) => (
              <a key={i} href="#" aria-label="Rede social" className="grid h-10 w-10 place-items-center rounded-full bg-sidebar-accent transition hover:bg-primary">
                <I className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <p className="border-t border-sidebar-border py-5 text-center text-xs opacity-70">© {new Date().getFullYear()} Impresso416. Todos os direitos reservados.</p>
    </footer>
  );
}
