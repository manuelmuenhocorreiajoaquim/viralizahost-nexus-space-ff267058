import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Server, Zap, Cloud, Check, ArrowRight, Globe } from "lucide-react";
import { Link } from "@tanstack/react-router";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { usePrice } from "@/lib/currency";

export const Route = createFileRoute("/hospedagem/web")({
  head: () => ({
    meta: [
      { title: "Hospedagem Web — ViralizaHost" },
      { name: "description", content: "Hospedagem Web premium com LiteSpeed, SSD NVMe, SSL grátis e Cloudflare CDN. Planos Starter, Business e Cloud Pro." },
      { property: "og:title", content: "Hospedagem Web — ViralizaHost" },
      { property: "og:description", content: "Servidores rápidos com LiteSpeed e SSD NVMe para o seu site." },
    ],
  }),
  component: HospedagemWebPage,
});

const plans = [
  {
    icon: Server, name: "Starter Host", price: "19", productId: "host-start", tag: "Para começar",
    features: ["1 Site", "10 GB SSD NVMe", "SSL grátis", "Email profissional", "Cloudflare CDN", "Suporte 24/7"],
  },
  {
    icon: Zap, name: "Business Cloud", price: "79", productId: "host-business", popular: true, tag: "Mais popular",
    features: ["Sites ilimitados", "LiteSpeed Web Server", "IA integrada", "Backup diário", "100 GB NVMe", "Email ilimitado"],
  },
  {
    icon: Cloud, name: "Cloud Pro", price: "159", productId: "host-pro", tag: "Performance máxima",
    features: ["Sites ilimitados", "Recursos dedicados", "Auto-scaling", "WAF + DDoS", "200 GB NVMe", "Migração grátis"],
  },
];

function HospedagemWebPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Server className="h-3.5 w-3.5" /> Hospedagem Web
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Hospedagem rápida, segura e <span className="text-gradient-primary">premium</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              LiteSpeed, SSD NVMe e Cloudflare CDN para o desempenho máximo do seu site. Domínio é opcional — adicione no checkout se desejar.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((p, i) => <PlanCard key={p.name} p={p} i={i} />)}
          </div>

          <div className="mt-14 rounded-2xl bg-card border border-border p-6 flex flex-col md:flex-row items-center gap-4">
            <Globe className="h-6 w-6 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground flex-1 text-center md:text-left">
              Domínio é opcional. Você pode registrar um novo, usar o seu atual ou continuar sem domínio agora.
            </p>
            <Link to="/dominios/registrar" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-primary/10 text-sm font-semibold transition">
              Pesquisar domínio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <CTAFooter />
    </div>
  );
}

function PlanCard({ p, i }: { p: typeof plans[number]; i: number }) {
  const displayPrice = usePrice(p.price);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: i * 0.07 }}
      className={`relative rounded-2xl bg-card p-6 border transition-all hover:-translate-y-2 ${p.popular ? "border-primary/50 shadow-glow" : "border-border shadow-card hover:shadow-glow-soft"}`}
    >
      {p.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow">
          MAIS POPULAR
        </div>
      )}
      <div className={`h-12 w-12 rounded-xl grid place-items-center mb-4 ${p.popular ? "bg-gradient-primary shadow-glow" : "bg-primary/10"}`}>
        <p.icon className={`h-6 w-6 ${p.popular ? "text-primary-foreground" : "text-primary"}`} />
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{p.tag}</div>
      <h3 className="text-xl font-bold mb-3">{p.name}</h3>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-4xl font-bold text-gradient-primary">{displayPrice}</span>
        <span className="text-sm text-muted-foreground">/mês</span>
      </div>
      <ul className="space-y-2.5 mb-6">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/checkout"
        search={{ step: "cycle" as const, product: p.productId }}
        className={`group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold transition ${p.popular ? "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02]" : "border border-border hover:bg-primary/10 hover:border-primary/40"}`}
      >
        Contratar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
      </Link>
    </motion.div>
  );
}
