import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bot, MessageCircle, Brain, Check, ArrowRight, Zap } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { usePrice } from "@/lib/currency";

export const Route = createFileRoute("/ia-automacao/chatbots-ia")({
  head: () => ({
    meta: [
      { title: "Chatbots IA — ViralizaHost" },
      { name: "description", content: "Chatbots inteligentes para WhatsApp e site com atendimento 24/7. Planos Starter, Business e Premium." },
      { property: "og:title", content: "Chatbots IA — ViralizaHost" },
      { property: "og:description", content: "Atendimento automático 24/7 com IA para o seu negócio." },
    ],
  }),
  component: ChatbotsPage,
});

const plans = [
  { icon: Bot, name: "Chatbot Starter", productId: "ai-chatbot-starter", price: "299", tag: "Entrada",
    features: ["Bot WhatsApp ou site", "Respostas automáticas", "Fluxo básico", "1 integração", "Suporte por e-mail"] },
  { icon: MessageCircle, name: "Chatbot Business", productId: "ai-automation-business", price: "799", popular: true, tag: "Mais escolhido",
    features: ["WhatsApp + site", "Atendimento 24/7", "CRM integrado", "Múltiplos fluxos", "Relatórios", "Suporte prioritário"] },
  { icon: Brain, name: "Chatbot Premium", productId: "ai-agent-premium", price: "1499", tag: "Performance",
    features: ["Agente IA inteligente", "Multicanais", "Integrações avançadas", "Dashboard exclusivo", "Treinamento de dados", "Suporte premium"] },
];

const perks = [
  { icon: Zap, title: "Atendimento 24/7", desc: "Seu negócio nunca para de responder." },
  { icon: MessageCircle, title: "WhatsApp & site", desc: "Integração com os principais canais." },
  { icon: Brain, title: "IA treinada", desc: "Modelos ajustados ao seu negócio." },
];

export default function ChatbotsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Bot className="h-3.5 w-3.5" /> Chatbots IA
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Atendimento <span className="text-gradient-primary">24/7 com IA</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Chatbots inteligentes para WhatsApp e site. Responda clientes, qualifique leads e venda mais — sem parar.
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
