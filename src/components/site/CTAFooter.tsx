import { Mail, Phone, MapPin, Send, MessageCircle, Instagram, Youtube, Linkedin, Facebook } from "lucide-react";
import logo from "@/assets/viralizahost-logo.png";

export default function CTAFooter() {
  return (
    <footer className="relative pt-24 pb-10 overflow-hidden">
      <div className="absolute inset-0 grid-bg grid-bg-fade pointer-events-none" />
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-[400px] w-[800px] rounded-full bg-primary/15 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        {/* Big CTA */}
        <div className="rounded-3xl glass p-10 md:p-16 text-center mb-20 shadow-elegant relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-60" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Pronto para <span className="text-gradient-primary">escalar</span> com a ViralizaHost?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Hospedagem, IA, marketing e design — um único parceiro para transformar o seu negócio.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="#planos" className="px-7 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 transition">
                Começar agora
              </a>
              <a href="#" className="px-7 py-3.5 rounded-full glass font-semibold hover:bg-primary/10 transition inline-flex items-center gap-2">
                <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Footer cols */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-border/40">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="ViralizaHost" className="h-10 brightness-0 invert" />
              <span className="font-display font-bold text-lg">VIRALIZA<span className="text-primary">HOST</span></span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mb-5">
              Ecossistema digital premium: hospedagem, IA, marketing, design e audiovisual. Hospedagem · Performance · Confiança.
            </p>
            <div className="flex gap-2">
              {[Instagram, Youtube, Linkedin, Facebook].map((I, i) => (
                <a key={i} href="#" className="h-10 w-10 rounded-full glass grid place-items-center hover:bg-primary/20 hover:shadow-glow transition">
                  <I className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol title="Serviços" links={["Hospedagem Web", "VPS & Cloud", "Email Corporativo", "IA & Automação", "Design", "Audiovisual"]} />
          <FooterCol title="Empresa" links={["Sobre nós", "Blog", "Carreiras", "Parceiros", "Imprensa", "Contacto"]} />

          <div>
            <h4 className="font-bold mb-4">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-3">Novidades, ofertas e insights premium.</p>
            <form className="flex gap-2">
              <input type="email" placeholder="seu@email.com" className="flex-1 glass rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <button className="h-10 w-10 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center shadow-glow hover:scale-105 transition">
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-5 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> contacto@viralizahost.com</div>
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> +244 900 000 000</div>
              <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /> Luanda · Lisboa · São Paulo</div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} ViralizaHost. Todos os direitos reservados.</div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Todos os sistemas operacionais
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Termos</a>
            <a href="#" className="hover:text-foreground">SLA</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="font-bold mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-primary transition">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}
