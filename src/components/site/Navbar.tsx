import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Menu, X, Globe, Server, Cloud, Cpu, Megaphone, Palette, Film, Phone, ArrowRight, MessageCircle, ChevronDown, Mail, Shield, Zap, Bot, BarChart3, Brain, Lock, ShieldCheck, Award, Building2 } from "lucide-react";
import logo from "@/assets/viralizahost-logo.png";
import { useCurrency, type Currency } from "@/lib/currency";
import { clearCheckoutState } from "@/lib/cart";

type MenuItem = { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; to?: string };
type MenuEntry = { label: string; icon: React.ComponentType<{ className?: string }>; to?: string; items?: MenuItem[] };

const menu: MenuEntry[] = [
  { label: "Domínios", icon: Globe, to: "/dominios/registrar", items: [
    { icon: Globe, title: "Registar Domínio", desc: ".com, .ao, .pt, .net", to: "/dominios/registrar" },
    { icon: Shield, title: "Proteção WHOIS", desc: "Privacidade total", to: "/dominios/protecao-whois" },
    { icon: ArrowRight, title: "Transferir Domínio", desc: "Migração grátis", to: "/dominios/transferir" },
  ]},
  { label: "Hospedagem", icon: Server, to: "/hospedagem/web", items: [
    { icon: Server, title: "Hospedagem Web", desc: "LiteSpeed + SSD", to: "/hospedagem/web" },
    { icon: Cloud, title: "Cloud Hosting", desc: "Escalável e rápido", to: "/hospedagem/cloud" },
    { icon: Mail, title: "Email Corporativo", desc: "Titan + IA", to: "/hospedagem/email-corporativo" },
    { icon: Shield, title: "Revenda WHM", desc: "Negócio próprio", to: "/hospedagem/revenda-whm" },
  ]},
  { label: "VPS & Cloud", icon: Cloud, to: "/vps-cloud/vps-nvme", items: [
    { icon: Zap, title: "VPS NVMe", desc: "Performance bruta", to: "/vps-cloud/vps-nvme" },
    { icon: Cloud, title: "Cloud Privada", desc: "Infra dedicada", to: "/vps-cloud/cloud-privada" },
    { icon: Server, title: "Servidor Dedicado", desc: "Bare metal", to: "/vps-cloud/servidor-dedicado" },
  ]},
  { label: "Certificados SSL", icon: Lock, to: "/certificados-ssl", items: [
    { icon: Lock, title: "SSL Básico", desc: "DV · HTTPS ativo", to: "/certificados-ssl" },
    { icon: ShieldCheck, title: "SSL Business", desc: "OV · empresas", to: "/certificados-ssl" },
    { icon: Globe, title: "SSL Wildcard", desc: "Subdomínios *.dom", to: "/certificados-ssl" },
    { icon: Award, title: "SSL Enterprise", desc: "EV · dedicado", to: "/certificados-ssl" },
  ]},
  { label: "IA & Automação", icon: Bot, to: "/ia-automacao/chatbots-ia", items: [
    { icon: Bot, title: "Chatbots IA", desc: "Atendimento 24/7", to: "/ia-automacao/chatbots-ia" },
    { icon: Cpu, title: "Automação n8n", desc: "Workflows ilimitados", to: "/ia-automacao/automacao-n8n" },
    { icon: MessageCircle, title: "IA WhatsApp", desc: "Vendas automáticas", to: "/ia-automacao/ia-whatsapp" },
    { icon: Brain, title: "OpenClaw", desc: "Agentes & integrações IA", to: "/ia-automacao/openclaw" },
  ]},
  { label: "Marketing", icon: Megaphone, to: "/marketing/trafego-pago", items: [
    { icon: BarChart3, title: "Tráfego Pago", desc: "Meta & Google Ads", to: "/marketing/trafego-pago" },
    { icon: Megaphone, title: "Gestão Social", desc: "Conteúdo premium", to: "/marketing/gestao-social" },
    { icon: Globe, title: "SEO Premium", desc: "Top do Google", to: "/marketing/seo-premium" },
  ]},
  { label: "Design", icon: Palette, to: "/design" },
  { label: "Audiovisual", icon: Film, to: "/audiovisual" },
  { label: "Nosso Escritório", icon: Building2, to: "/nosso-escritorio" },
  { label: "Contacto", icon: Phone, to: "/contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAcc, setMobileAcc] = useState<string | null>(null);
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
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 xl:px-12">
        <div className="flex h-[72px] xl:h-[82px] items-center justify-between gap-3">
          <Link
            to="/"
            onClick={() => {
              setOpen(null);
              setMobileOpen(false);
              setCurrOpen(false);
              clearCheckoutState();
            }}
            className="flex items-center shrink-0 cursor-pointer"
            aria-label="Ir para a página inicial"
          >
            <img
              src={logo}
              alt="ViralizaHost"
              className="h-[42px] xl:h-[50px] w-auto object-contain"
            />
          </Link>

          <nav className="hidden xl:flex items-center gap-0 mx-auto" onMouseLeave={() => setOpen(null)}>
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
                    className="flex items-center gap-1 px-2.5 py-2 text-[13px] font-medium text-white/90 hover:text-[#3BA9FF] transition-colors rounded-md whitespace-nowrap"
                  >
                    {TriggerInner}
                  </Link>
                ) : (
                  <button className="flex items-center gap-1 px-2.5 py-2 text-[13px] font-medium text-white/90 hover:text-[#3BA9FF] transition-colors rounded-md whitespace-nowrap">
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

          <div className="hidden xl:flex items-center gap-2 shrink-0 relative">
            <a
              href="/login"
              className="px-2.5 py-2 rounded-full text-[13px] font-semibold text-white/90 hover:text-[#3BA9FF] transition whitespace-nowrap"
            >
              Área do Cliente
            </a>
            <button
              onClick={() => setCurrOpen((v) => !v)}
              onBlur={() => setTimeout(() => setCurrOpen(false), 150)}
              className="flex items-center gap-1.5 px-2.5 py-2 rounded-full text-[13px] font-semibold bg-white/10 backdrop-blur-md border border-white/15 text-white hover:text-[#3BA9FF] hover:border-[#3BA9FF]/40 transition whitespace-nowrap"
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

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="xl:hidden p-2 text-white"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="xl:hidden fixed inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", zIndex: 90 }}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
              className="xl:hidden fixed top-0 right-0 bottom-0 flex flex-col text-white"
              style={{
                width: "min(88vw, 380px)",
                backgroundColor: "#050C18",
                borderLeft: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 20px 60px -15px rgba(0,0,0,0.6)",
                zIndex: 100,
              }}
            >
              <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <Link to="/" onClick={() => { setMobileOpen(false); clearCheckoutState(); }} className="flex items-center">
                  <img src={logo} alt="ViralizaHost" className="h-9 w-auto object-contain" />
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {menu.map((m) => {
                  const hasItems = !!m.items?.length;
                  const isAccOpen = mobileAcc === m.label;
                  return (
                    <div key={m.label}>
                      {hasItems ? (
                        <button
                          onClick={() => setMobileAcc(isAccOpen ? null : m.label)}
                          className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-white hover:bg-white/10 transition"
                        >
                          <span className="flex items-center gap-3">
                            <m.icon className="h-4 w-4 text-[#3BA9FF]" />
                            <span className="text-sm font-medium">{m.label}</span>
                          </span>
                          <ChevronDown className={`h-4 w-4 text-white/60 transition-transform ${isAccOpen ? "rotate-180" : ""}`} />
                        </button>
                      ) : (
                        <Link
                          to={m.to!}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 px-3 py-3 rounded-xl text-white hover:bg-white/10 hover:text-[#3BA9FF] transition"
                        >
                          <m.icon className="h-4 w-4 text-[#3BA9FF]" />
                          <span className="text-sm font-medium">{m.label}</span>
                        </Link>
                      )}
                      <AnimatePresence initial={false}>
                        {hasItems && isAccOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="ml-4 mt-1 mb-2 pl-3 border-l border-white/10 space-y-1">
                              {m.items!.filter((it) => it.to).map((it) => (
                                <Link
                                  key={it.title}
                                  to={it.to!}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-white/80 text-xs hover:bg-white/10 hover:text-[#3BA9FF] transition"
                                >
                                  <it.icon className="h-3.5 w-3.5 text-[#3BA9FF]" />
                                  {it.title}
                                </Link>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                <a
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-white hover:bg-white/10 hover:text-[#3BA9FF] transition"
                >
                  <Phone className="h-4 w-4 text-[#3BA9FF]" />
                  <span className="text-sm font-medium">Área do Cliente</span>
                </a>
              </div>

              <div className="px-4 py-4 border-t border-white/10 flex items-center gap-2 shrink-0">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setCurrency(c.code)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border transition ${
                      c.code === currency
                        ? "bg-[#3BA9FF]/20 border-[#3BA9FF]/60 text-white"
                        : "bg-white/5 border-white/10 text-white/80"
                    }`}
                  >
                    <span style={flagStyle}>{c.flag}</span> {c.cc} · {c.label}
                  </button>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
