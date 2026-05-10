import { motion } from "framer-motion";
import { Check, Zap, Crown, Cloud, Server, ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "./Section";

const plans = [
  {
    icon: Server, name: "Starter Host", price: "19", popular: false,
    tag: "Para começar",
    features: ["1 Site", "10 GB SSD NVMe", "SSL grátis", "Email profissional", "Cloudflare CDN", "Suporte 24/7"],
  },
  {
    icon: Zap, name: "Business Cloud", price: "79", popular: true,
    tag: "Mais popular",
    features: ["Sites ilimitados", "LiteSpeed Web Server", "IA integrada", "Backup diário", "100 GB NVMe", "Email ilimitado"],
  },
  {
    icon: Cloud, name: "Cloud Pro", price: "159", popular: false,
    tag: "Performance máxima",
    features: ["Sites ilimitados", "Recursos dedicados", "Auto-scaling", "WAF + DDoS", "200 GB NVMe", "Migração grátis"],
  },
  {
    icon: Crown, name: "Revenda WHM", price: "249", popular: false,
    tag: "Negócio próprio",
    features: ["Contas ilimitadas", "WHM + cPanel", "Marca branca", "DNS próprios", "500 GB NVMe", "Suporte premium"],
  },
];

export default function HostingPlans() {
  return (
    <Section id="planos">
      <SectionHeader
        eyebrow="Hospedagem Premium"
        title="Planos para qualquer escala"
        desc="Servidores LiteSpeed com SSD NVMe, IA integrada e infraestrutura global."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p, idx) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.08 }}
            className={`relative rounded-2xl p-6 transition-all hover:-translate-y-2 ${
              p.popular ? "glass shadow-glow border-primary/40" : "glass hover:shadow-glow-soft"
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow">
                MAIS POPULAR
              </div>
            )}
            <div className={`h-12 w-12 rounded-xl grid place-items-center mb-4 ${p.popular ? "bg-gradient-primary shadow-glow" : "bg-surface-elevated"}`}>
              <p.icon className={`h-6 w-6 ${p.popular ? "text-primary-foreground" : "text-primary"}`} />
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{p.tag}</div>
            <h3 className="text-xl font-bold mb-3">{p.name}</h3>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-sm text-muted-foreground">R$</span>
              <span className="text-5xl font-bold text-gradient-primary">{p.price}</span>
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
            <a href="#" className={`group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold transition ${
              p.popular ? "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02]" : "glass hover:bg-primary/10"
            }`}>
              Contratar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </a>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
