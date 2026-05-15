import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Film, Camera, Video, Clapperboard, Mic, Check, ArrowRight } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import AudiovisualShowcase, { CreativeProcess, AudiovisualStats, EquipmentGallery } from "@/components/site/AudiovisualShowcase";
import { usePrice } from "@/lib/currency";

export const Route = createFileRoute("/audiovisual")({
  head: () => ({
    meta: [
      { title: "Audiovisual Profissional — ViralizaHost" },
      { name: "description", content: "Produção audiovisual: vídeos institucionais, reels, fotografia e cobertura de eventos." },
      { property: "og:title", content: "Audiovisual Profissional — ViralizaHost" },
      { property: "og:description", content: "Conteúdo em vídeo e foto para escalar sua marca." },
    ],
  }),
  component: AudiovisualPage,
});

const services = [
  { icon: Video, name: "Reels Profissional", productId: "av-reels-prof", price: "250", tag: "Express",
    features: ["1 reel editado", "Captação + edição", "Trilha + legendas", "Formato vertical"] },
  { icon: Clapperboard, name: "Pacote Reels", productId: "av-reels", price: "990", tag: "Mensal",
    features: ["4 reels/mês", "Roteiro + edição", "Direção criativa", "Captação inclusa"] },
  { icon: Film, name: "Vídeo Institucional", productId: "av-institutional", price: "1500", popular: true, tag: "Mais escolhido",
    features: ["Roteiro + storyboard", "Captação 4K", "Edição premium", "Trilha + locução", "Entrega multi-formato"] },
  { icon: Camera, name: "Cobertura de Evento", productId: "av-event", price: "2500", tag: "Eventos",
    features: ["Equipe completa", "Vídeo + foto", "Aftermovie", "Edição em até 7 dias"] },
  { icon: Mic, name: "VSL Premium", productId: "av-vsl", price: "2490", tag: "Performance",
    features: ["Roteiro de vendas", "Captação + edição", "Storytelling", "Otimizado para tráfego"] },
  { icon: Film, name: "Studio Audiovisual", productId: "av-studio", price: "4990", tag: "Studio",
    features: ["Produção completa", "Equipe dedicada", "Múltiplas entregas", "Direção criativa"] },
];

export default function AudiovisualPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Film className="h-3.5 w-3.5" /> Audiovisual
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Conteúdo em vídeo que <span className="text-gradient-primary">vende e engaja</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Produção profissional de vídeo, fotografia, reels e cobertura de eventos — com qualidade de marca.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((p, i) => <ServiceCard key={p.productId} p={p} i={i} />)}
          </div>
        </div>
      </main>
      <AudiovisualShowcase />
      <CreativeProcess />
      <AudiovisualStats />
      <EquipmentGallery />
      <CTAFooter />
    </div>
  );
}

function ServiceCard({ p, i }: { p: typeof services[number]; i: number }) {
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
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow">MAIS POPULAR</div>
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
