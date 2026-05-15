import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Menu, X, Globe, Server, Cloud, Cpu, Megaphone, Palette, Film, Building2, Phone, ArrowRight, MessageCircle, ChevronDown, Mail, Shield, Zap, Bot, BarChart3 } from "lucide-react";
import logo from "@/assets/viralizahost-logo.png";
import { useCurrency, type Currency } from "@/lib/currency";

type MenuItem = { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; to?: string };
type MenuEntry = { label: string; icon: React.ComponentType<{ className?: string }>; to?: string; items?: MenuItem[] };

const menu: MenuEntry[] = [
  { label: "Domínios", icon: Globe, to: "/dominios/registrar", items: [
    { icon: Globe, title: "Registar Domínio", desc: ".com, .ao, .pt, .net", to: "/dominios/registrar" },
    { icon: Shield, title: "Proteção WHOIS", desc: "Privacidade total", to: "/dominios/protecao-whois" },
    { icon: ArrowRight, title: "Transferir Domínio", desc: "Migração grátis", to: "/dominios/transferir" },
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
  const currencies: { code: Currency; flag: string; cc: string; label: string; country: string }[] = [
    { code: "BRL", flag: "🇧🇷", cc: "BR", label: "BRL", country: "Brasil" },
    { code: "AKZ", flag: "🇦🇴", cc: "AO", label: "AKZ", country: "Angola" },
  ];
  const flagStyle = {
    fontFamily:
      '"Noto Color Emoji","Apple Color Emoji","Segoe UI Emoji","Twemoji Country Flags","Segoe UI Symbol",sans-serif',
    fontSize: "18px",
    lineHeight: 1,
  } as const;
  const active = currencies.find((c) => c.code === currency)!;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 text-white border-b border-white/8"
      style={{
        backgroundColor: "rgba(5, 12, 24, 0.72)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottomColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-16">
        <div className="flex h-[82px] items-center justify-between gap-6">
          <a href="#" className="flex items-center shrink-0">
            <img
              src={logo}
              alt="ViralizaHost"
              className="h-[46px] lg:h-[50px] w-auto object-contain"
            />
          </a>

          <nav className="hidden lg:flex items-center gap-0.5 mx-auto" onMouseLeave={() => setOpen(null)}>
            {menu.map((m) => {
              const TriggerInner = (
                <>
                  {m.label}
                  {m.items && <ChevronDown className="h-3 w-3 opacity-60" />}
                </>
              );
              return (
              <div key={m.label} className="relative" onMouseEnter={() => setOpen(m.items ? m.label : null)}>
                {m.to ? (
                  <Link
                    to={m.to}
                    onClick={() => setOpen(null)}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/90 hover:text-[#3BA9FF] transition-colors rounded-md whitespace-nowrap"
                  >
                    {TriggerInner}
                  </Link>
                ) : (
                  <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/90 hover:text-[#3BA9FF] transition-colors rounded-md whitespace-nowrap">
                    {TriggerInner}
                  </button>
                )}
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
                        {m.items.map((it) => {
                          const itemBody = (
                            <>
                              <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center shrink-0 shadow-glow">
                                <it.icon className="h-5 w-5 text-primary-foreground" />
                              </div>
                              <div>
                                <div className="text-sm font-semibold">{it.title}</div>
                                <div className="text-xs text-muted-foreground">{it.desc}</div>
                              </div>
                            </>
                          );
                          const cls = "flex items-start gap-3 p-3 rounded-xl hover:bg-primary/10 transition group";
                          return it.to ? (
                            <Link key={it.title} to={it.to} onClick={() => setOpen(null)} className={cls}>
                              {itemBody}
                            </Link>
                          ) : (
                            <a key={it.title} href="#" className={cls}>
                              {itemBody}
                            </a>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              );
            })}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0 relative">
            <a
              href="/login"
              className="px-3 py-2 rounded-full text-sm font-semibold text-white/90 hover:text-[#3BA9FF] transition"
            >
              Área do Cliente
            </a>
            <button
              onClick={() => setCurrOpen((v) => !v)}
              onBlur={() => setTimeout(() => setCurrOpen(false), 150)}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-white hover:text-[#3BA9FF] hover:border-[#3BA9FF]/40 transition"
            >
              <span style={flagStyle} className="leading-none">{active.flag}</span>
              <span>{active.cc} · {active.label}</span>
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
                      <span style={flagStyle} className="leading-none">{c.flag}</span>
                      <span>{c.country} — {c.label}</span>
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
                <div key={m.label}>
                  {m.to ? (
                    <Link
                      to={m.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg text-white hover:bg-white/10 hover:text-[#3BA9FF] transition"
                    >
                      <m.icon className="h-4 w-4 text-[#3BA9FF]" />
                      <span className="text-sm font-medium">{m.label}</span>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-white/90">
                      <m.icon className="h-4 w-4 text-[#3BA9FF]" />
                      <span className="text-sm font-medium">{m.label}</span>
                    </div>
                  )}
                  {m.items && (
                    <div className="ml-7 mb-2 space-y-1">
                      {m.items.filter((it) => it.to).map((it) => (
                        <Link
                          key={it.title}
                          to={it.to!}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-md text-white/80 text-xs hover:bg-white/10 hover:text-[#3BA9FF] transition"
                        >
                          <it.icon className="h-3.5 w-3.5 text-[#3BA9FF]" />
                          {it.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
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
                    <span style={flagStyle}>{c.flag}</span> {c.cc} · {c.label}
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
