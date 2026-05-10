import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Globe, Server, Cloud, Cpu, Megaphone, Palette, Film, Building2, Phone, ArrowRight, MessageCircle, ChevronDown, Mail, Shield, Zap, Bot, BarChart3 } from "lucide-react";
import logo from "@/assets/viralizahost-logo.png";
import { useCurrency, type Currency } from "@/lib/currency";

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
  const [currOpen, setCurrOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const currencies: { code: Currency; flag: string; label: string }[] = [
    { code: "BRL", flag: "🇧🇷", label: "BRL" },
    { code: "AKZ", flag: "🇦🇴", label: "AKZ" },
  ];
  const active = currencies.find((c) => c.code === currency)!;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 text-white ${
        scrolled
          ? "bg-[oklch(0.15_0.02_255/0.7)] backdrop-blur-xl border-b border-white/10"
          : "bg-gradient-to-b from-black/40 to-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          <a href="#" className="flex items-center gap-2 group shrink-0">
            <img
              src={logo}
              alt="ViralizaHost"
              className="relative h-12 lg:h-14 w-auto drop-shadow-[0_4px_20px_rgba(0,123,255,0.4)]"
            />
          </a>

          <nav className="hidden lg:flex items-center gap-1" onMouseLeave={() => setOpen(null)}>
            {menu.map((m) => (
              <div key={m.label} className="relative" onMouseEnter={() => setOpen(m.items ? m.label : null)}>
                <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/90 hover:text-[#3BA9FF] transition-colors rounded-md whitespace-nowrap">
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
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[420px] glass rounded-2xl p-3 shadow-elegant text-foreground"
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

          <div className="hidden lg:flex items-center gap-3 shrink-0 relative">
            <button
              onClick={() => setCurrOpen((v) => !v)}
              onBlur={() => setTimeout(() => setCurrOpen(false), 150)}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-white hover:text-[#3BA9FF] hover:border-[#3BA9FF]/40 transition"
            >
              <span className="text-base leading-none">{active.flag}</span>
              <span>{active.label}</span>
              <ChevronDown className={`h-3 w-3 opacity-70 transition ${currOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {currOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-44 glass rounded-xl p-1.5 shadow-elegant text-foreground z-50"
                >
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCurrency(c.code);
                        setCurrOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                        c.code === currency ? "bg-primary/15 text-primary" : "hover:bg-primary/10"
                      }`}
                    >
                      <span className="text-base leading-none">{c.flag}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-white">
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
            className="lg:hidden bg-[oklch(0.15_0.02_255/0.95)] backdrop-blur-xl overflow-hidden border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-1">
              {menu.map((m) => (
                <a key={m.label} href="#" className="flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-white/10 hover:text-[#3BA9FF] transition">
                  <m.icon className="h-4 w-4 text-[#3BA9FF]" />
                  <span className="text-sm font-medium">{m.label}</span>
                </a>
              ))}
              <div className="flex items-center gap-2 px-3 py-3">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold border transition ${
                      c.code === currency
                        ? "bg-[#3BA9FF]/20 border-[#3BA9FF]/60 text-white"
                        : "bg-white/5 border-white/10 text-white/80"
                    }`}
                  >
                    <span>{c.flag}</span> {c.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
