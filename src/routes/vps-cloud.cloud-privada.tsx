import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Cloud, Shield, Activity, Server, Lock, ArrowRight, Check, MessageCircle } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { usePrice } from "@/lib/currency";

export const Route = createFileRoute("/vps-cloud/cloud-privada")({
  head: () => ({
    meta: [
      { title: "Cloud Privada — ViralizaHost" },
      { name: "description", content: "Infraestrutura cloud privada e dedicada com alta disponibilidade, segurança corporativa e escalabilidade automática." },
      { property: "og:title", content: "Cloud Privada — ViralizaHost" },
      { property: "og:description", content: "Cloud dedicada com SLA premium e segurança corporativa." },
    ],
  }),
  component: CloudPrivadaPage,
});

const features = [
  { icon: Server, title: "Infraestrutura dedicada", desc: "Recursos isolados, sem vizinhos barulhentos." },
  { icon: Shield, title: "Segurança corporativa", desc: "Firewall avançado, WAF e proteção DDoS premium." },
  { icon: Activity, title: "Alta disponibilidade", desc: "Arquitetura redundante com SLA 99,99%." },
  { icon: Lock, title: "Compliance & LGPD", desc: "Atende normas LGPD e padrões corporativos." },
];

const plan = {
  productId: "cloud-privada",
  price: "1290",
  features: [
    "Recursos dedicados garantidos",
    "Auto-scaling sob demanda",
    "Backup geo-redundante",
    "Firewall + WAF + DDoS",
    "Monitoramento 24/7",
    "SLA 99,99%",
    "Gerente de conta dedicado",
    "Suporte prioritário 24/7",
  ],
};

function CloudPrivadaPage() {
  const displayPrice = usePrice(plan.price);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Cloud className="h-3.5 w-3.5" /> Cloud Privada
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Cloud <span className="text-gradient-primary">privada e dedicada</span> para sua empresa
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Infraestrutura corporativa com alta disponibilidade, segurança e escalabilidade. Para projetos críticos que não podem parar.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-2xl bg-card border border-border p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow-soft mb-3">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="max-w-3xl mx-auto rounded-3xl bg-card p-8 border border-primary/50 shadow-glow relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow">
              CORPORATIVO
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-primary grid place-items-center mb-5 shadow-glow">
              <Cloud className="h-7 w-7 text-primary-foreground" />
            </div>
            <h3 className="text-2xl font-bold mb-3">Cloud Privada</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-sm text-muted-foreground">a partir de</span>
              <span className="text-5xl font-bold text-gradient-primary">{displayPrice}</span>
              <span className="text-sm text-muted-foreground">/mês</span>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2.5 mb-7">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/85">{f}</span>
                </li>
              ))}
            </ul>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                to="/checkout"
                search={{ step: "cycle" as const, product: plan.productId }}
                className="group flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl font-semibold bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.01] transition-all"
              >
                Contratar agora <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </Link>
              <a
                href="https://wa.me/5511999999999?text=Quero%20uma%20proposta%20de%20Cloud%20Privada"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl font-semibold border border-border hover:bg-primary/10 hover:border-primary/40 transition"
              >
                <MessageCircle className="h-4 w-4" /> Solicitar proposta
              </a>
            </div>
          </motion.div>
        </div>
      </main>
      <CTAFooter />
    </div>
  );
}
