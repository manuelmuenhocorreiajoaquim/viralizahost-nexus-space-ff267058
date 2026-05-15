import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MessageCircle, Bot, TrendingUp, Check, ArrowRight, Zap, Target } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { usePrice } from "@/lib/currency";

export const Route = createFileRoute("/ia-automacao/ia-whatsapp")({
  head: () => ({
    meta: [
      { title: "IA WhatsApp — ViralizaHost" },
      { name: "description", content: "Agente de vendas IA no WhatsApp: atendimento automático, qualificação de leads, funil completo e integração total." },
      { property: "og:title", content: "IA WhatsApp — ViralizaHost" },
      { property: "og:description", content: "Vendas automáticas e atendimento 24/7 no WhatsApp com IA." },
    ],
  }),
  component: WhatsAppPage,
});

const plans = [
  { icon: MessageCircle, name: "WhatsApp Start", productId: "ai-wa-start", price: "390", tag: "Entrada",
    features: ["1 número WhatsApp", "Atendimento automático", "Respostas inteligentes", "Horário comercial", "Suporte por e-mail"] },
  { icon: Bot, name: "WhatsApp Vendas", productId: "ai-wa-vendas", price: "990", popular: true, tag: "Mais escolhido",
    features: ["Agente IA de vendas", "Qualificação de leads", "Funil automatizado", "Integração CRM", "Relatórios", "Suporte prioritário"] },
  { icon: TrendingUp, name: "WhatsApp Premium", productId: "ai-wa-premium", price: "1990", tag: "Performance",
    features: ["Multi-atendentes IA", "Multicanais", "Integrações avançadas", "Dashboard exclusivo", "Treinamento personalizado", "Suporte premium"] },
];

const perks = [
  { icon: Zap, title: "Vendas 24/7", desc: "Agente IA vendendo enquanto você dorme." },
  { icon: Target, title: "Qualificação automática", desc: "Filtra leads e envia só os quentes para você." },
  { icon: Bot, title: "IA conversacional", desc: "Conversas naturais e personalizadas." },
];

export default function WhatsAppPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <MessageCircle className="h-3.5 w-3.5" /> IA WhatsApp
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Venda mais no <span className="text-gradient-primary">WhatsApp</span> com IA
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Agente de vendas inteligente, atendimento automático e funil completo no WhatsApp. Mais leads, mais vendas, menos esforço.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {perks.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.05 }} className="rounded-2xl bg-card border border-border p-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow-soft mb-3">
                  <p.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((p, i) => <PlanCard key={p.name} p={p} i={i} />)}
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
        <span className="text-sm text-muted-foreground">/projeto</span>
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
        search={{ product: p.productId }}
        className={`group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold transition ${p.popular ? "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02]" : "border border-border hover:bg-primary/10 hover:border-primary/40"}`}
      >
        Contratar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
      </Link>
    </motion.div>
  );
}
