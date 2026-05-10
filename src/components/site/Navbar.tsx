import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, Server, Cloud, Cpu, Megaphone, Palette, Film, Building2, Phone, ArrowRight, MessageCircle, ChevronDown, Mail, Shield, Zap, Bot, BarChart3 } from "lucide-react";
import logo from "@/assets/viralizahost-logo.png";

const menu = [
  { label: "Domínios", icon: Globe, items: [
    { icon: Globe, title: "Registar Domínio", desc: ".com, .ao, .pt, .net" },
    { icon: Shield, title: "Proteção WHOIS", desc: "Privacidade total" },
    { icon: ArrowRight, title: "Transferir Domínio", desc: "Migração grátis" },
  ]},
  { label: "Hospedagem", icon: Server, items: [
    { icon: Server, title: "Hospedagem Web", desc: "LiteSpeed + SSD" },
    { icon: Cloud, title: "Cloud Hosting", desc: "Escalável e rápido" },
    { icon: Mail, title: "Email Corporativo", desc: "Titan + IA" },
    { icon: Shield, title: "Revenda WHM", desc: "Negócio próprio" },
  ]},
  { label: "VPS & Cloud", icon: Cloud, items: [
    { icon: Zap, title: "VPS NVMe", desc: "Performance bruta" },
    { icon: Cloud, title: "Cloud Privada", desc: "Infra dedicada" },
    { icon: Server, title: "Servidor Dedicado", desc: "Bare metal" },
  ]},
  { label: "IA & Automação", icon: Bot, items: [
    { icon: Bot, title: "Chatbots IA", desc: "Atendimento 24/7" },
    { icon: Cpu, title: "Automação n8n", desc: "Workflows ilimitados" },
    { icon: MessageCircle, title: "IA WhatsApp", desc: "Vendas automáticas" },
  ]},
  { label: "Marketing", icon: Megaphone, items: [
    { icon: BarChart3, title: "Tráfego Pago", desc: "Meta & Google Ads" },
    { icon: Megaphone, title: "Gestão Social", desc: "Conteúdo premium" },
    { icon: Globe, title: "SEO Premium", desc: "Top do Google" },
  ]},
  { label: "Design", icon: Palette },
  { label: "Audiovisual", icon: Film },
  { label: "Empresa", icon: Building2 },
  { label: "Contacto", icon: Phone },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "glass-strong" : "bg-transparent"}`}>
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <a href="#" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full group-hover:bg-primary/60 transition" />
              <img src={logo} alt="ViralizaHost" className="relative h-10 w-auto brightness-0 invert" />
            </div>
            <span className="hidden sm:block font-display font-bold text-lg tracking-tight">
              VIRALIZA<span className="text-primary">HOST</span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-1" onMouseLeave={() => setOpen(null)}>
            {menu.map((m) => (
              <div key={m.label} className="relative" onMouseEnter={() => setOpen(m.items ? m.label : null)}>
                <button className="flex items-center gap-1 px-3 py-2 text-sm text-foreground/80 hover:text-foreground transition rounded-md">
                  {m.label}
                  {m.items && <ChevronDown className="h-3 w-3 opacity-60" />}
                </button>
                <AnimatePresence>
                  {open === m.label && m.items && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[420px] glass rounded-2xl p-3 shadow-elegant"
                    >
                      <div className="grid grid-cols-1 gap-1">
                        {m.items.map((it) => (
                          <a key={it.title} href="#" className="flex items-start gap-3 p-3 rounded-xl hover:bg-primary/10 transition group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center shrink-0 shadow-glow">
                              <it.icon className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">{it.title}</div>
                              <div className="text-xs text-muted-foreground">{it.desc}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <a href="#" className="flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:text-primary transition">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            <a href="#planos" className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:scale-105 transition">
              Começar Agora <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
            </a>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-foreground">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-strong overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {menu.map((m) => (
                <a key={m.label} href="#" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-primary/10">
                  <m.icon className="h-4 w-4 text-primary" />
                  <span className="text-sm">{m.label}</span>
                </a>
              ))}
              <a href="#planos" className="block mt-2 text-center px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground text-sm font-semibold">
                Começar Agora
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
