import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Palette, Sparkles, Layers, Image as ImageIcon, Star, Check, ArrowRight } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { usePrice } from "@/lib/currency";

export const Route = createFileRoute("/design")({
  head: () => ({
    meta: [
      { title: "Design Profissional — ViralizaHost" },
      { name: "description", content: "Design profissional para marcas que querem crescer: flyers, social media, branding e identidade completa." },
      { property: "og:title", content: "Design Profissional — ViralizaHost" },
      { property: "og:description", content: "Cards modernos, branding premium e identidade visual para escalar sua marca." },
    ],
  }),
  component: DesignPage,
});

const services = [
  { icon: ImageIcon, name: "Flyer Digital", productId: "design-flyer", price: "80", tag: "Express",
    features: ["Arte profissional", "Formato redes sociais", "Entrega em 24h", "1 revisão"] },
  { icon: Layers, name: "Social Media Kit", productId: "design-social-kit", price: "350", tag: "Pacote",
    features: ["10 posts personalizados", "Stories e capas", "Templates editáveis", "Identidade coesa"] },
  { icon: Sparkles, name: "Branding Premium", productId: "design-branding-premium", price: "1500", popular: true, tag: "Mais escolhido",
    features: ["Logo + variações", "Manual da marca", "Paleta + tipografia", "Mockups premium", "Suporte dedicado"] },
  { icon: Star, name: "Identidade Completa", productId: "design-studio", price: "2890", tag: "Studio",
    features: ["Branding completo", "Social media kit", "Cartão + papelaria", "Pitch deck", "Direção criativa"] },
  { icon: Palette, name: "Artes Premium Demo", productId: "design-brand", price: "1490", tag: "Showcase",
    features: ["Direção visual", "3 conceitos", "Mockups realistas", "Arquivos editáveis"] },
];

export default function DesignPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Palette className="h-3.5 w-3.5" /> Design
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Design profissional para marcas que <span className="text-gradient-primary">querem crescer</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Branding, social media e identidade visual feitos por designers premium — pensado para gerar resultado.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((p, i) => <ServiceCard key={p.productId} p={p} i={i} />)}
          </div>
        </div>
      </main>
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
