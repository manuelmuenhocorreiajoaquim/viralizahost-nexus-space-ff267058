import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Crown, Check, ArrowRight, Server, Globe, Palette, HeadphonesIcon } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { usePrice } from "@/lib/currency";

export const Route = createFileRoute("/hospedagem/revenda-whm")({
  head: () => ({
    meta: [
      { title: "Revenda WHM — ViralizaHost" },
      { name: "description", content: "Plano de Revenda WHM + cPanel, contas ilimitadas, DNS próprios e marca branca para iniciar seu negócio de hospedagem." },
      { property: "og:title", content: "Revenda WHM — ViralizaHost" },
      { property: "og:description", content: "Monte sua própria hospedagem com WHM + cPanel e marca branca." },
    ],
  }),
  component: RevendaWHMPage,
});

const plan = {
  icon: Crown, name: "Revenda WHM", price: "249", productId: "host-revenda", tag: "Negócio próprio",
  features: [
    "Contas cPanel ilimitadas",
    "WHM + cPanel oficial",
    "Marca branca completa",
    "DNS próprios (ns1, ns2)",
    "500 GB SSD NVMe",
    "Largura de banda ilimitada",
    "SSL grátis para todos os clientes",
    "Suporte premium 24/7",
  ],
};

const perks = [
  { icon: Server, title: "WHM + cPanel", desc: "Painel oficial líder de mercado." },
  { icon: Palette, title: "Marca branca", desc: "Use sua marca, sua identidade." },
  { icon: Globe, title: "DNS próprios", desc: "Nameservers personalizados." },
  { icon: HeadphonesIcon, title: "Suporte premium", desc: "Atendimento prioritário 24/7." },
];

function RevendaWHMPage() {
  const displayPrice = usePrice(plan.price);
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
              <Crown className="h-3.5 w-3.5" /> Revenda WHM
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Monte seu próprio <span className="text-gradient-primary">negócio de hospedagem</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              WHM + cPanel oficial, DNS próprios e marca branca. Tudo o que você precisa para revender hospedagem com a sua marca.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {perks.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-2xl bg-card border border-border p-5"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow-soft mb-3">
                  <p.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto rounded-3xl bg-card p-8 border border-primary/50 shadow-glow relative"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow">
              RECOMENDADO
            </div>
            <div className="h-14 w-14 rounded-xl bg-gradient-primary grid place-items-center mb-5 shadow-glow">
              <plan.icon className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{plan.tag}</div>
            <h3 className="text-2xl font-bold mb-3">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
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
            <Link
              to="/checkout"
              search={{ step: "cycle" as const, product: plan.productId }}
              className="group flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-xl font-semibold bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.01] transition-all"
            >
              Contratar Revenda WHM <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </Link>
          </motion.div>
        </div>
      </main>
      <CTAFooter />
    </div>
  );
}
