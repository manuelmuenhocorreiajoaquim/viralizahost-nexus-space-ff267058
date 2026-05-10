import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Server, Bot, Palette, TrendingUp, Film } from "lucide-react";
import s1 from "@/assets/hero-servers.jpg";
import s2 from "@/assets/hero-ai.jpg";
import s3 from "@/assets/hero-design.jpg";
import s4 from "@/assets/hero-social.jpg";
import s5 from "@/assets/hero-video.jpg";

const slides = [
  { img: s1, icon: Server, eyebrow: "Hospedagem Premium", title: "Infraestrutura cloud de alta performance", desc: "Servidores LiteSpeed NVMe, uptime 99.99% e suporte humano 24/7 para empresas modernas.", cta1: "Ver planos", cta2: "Criar website" },
  { img: s2, icon: Bot, eyebrow: "IA & Automação", title: "Automatize tudo com Inteligência Artificial", desc: "Chatbots, agentes autónomos e integrações n8n que escalam o seu negócio.", cta1: "Falar com IA", cta2: "Ver demo" },
  { img: s3, icon: Palette, eyebrow: "Design & Branding", title: "Marcas visuais que geram autoridade", desc: "Identidade, UI/UX e motion design de nível internacional.", cta1: "Pedir orçamento", cta2: "Ver portfólio" },
  { img: s4, icon: TrendingUp, eyebrow: "Crescimento Social", title: "Escalamos sua presença digital", desc: "Estratégias modernas para Instagram, TikTok e YouTube.", cta1: "Crescer agora", cta2: "Cases" },
  { img: s5, icon: Film, eyebrow: "Audiovisual Premium", title: "Produção cinematográfica para marcas", desc: "Vídeos institucionais, reels e comerciais de alto impacto.", cta1: "Solicitar projeto", cta2: "Ver showreel" },
];

export default function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[i];

  return (
    <section className="relative min-h-screen w-full overflow-hidden pt-20">
      <div className="absolute inset-0 grid-bg grid-bg-fade pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

      {/* floating orbs */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] animate-pulse-glow" />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-royal/30 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-primary">
              <slide.icon className="h-3.5 w-3.5" />
              {slide.eyebrow}
              <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05]">
              <span className="text-gradient">{slide.title}</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">{slide.desc}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#planos" className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-[1.03] transition">
                {slide.cta1} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </a>
              <a href="#" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full glass text-foreground font-semibold hover:bg-primary/10 transition">
                <Play className="h-4 w-4" /> {slide.cta2}
              </a>
            </div>

            <div className="flex items-center gap-6 pt-6 border-t border-border/40">
              {[
                { v: "99.99%", l: "Uptime" },
                { v: "+12K", l: "Clientes" },
                { v: "5★", l: "Reviews" },
                { v: "24/7", l: "Suporte" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-xl font-bold text-gradient-primary">{s.v}</div>
                  <div className="text-xs text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`img-${i}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-gradient-primary opacity-30 blur-3xl rounded-full" />
            <div className="relative rounded-3xl overflow-hidden glass shadow-elegant animate-float">
              <img src={slide.img} alt={slide.title} width={1536} height={1024} className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between glass rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium">Servidores online</span>
                </div>
                <div className="text-xs text-muted-foreground">Latência: 12ms</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* slide indicators */}
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8 pb-10 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-12 bg-gradient-primary shadow-glow" : "w-6 bg-muted hover:bg-muted-foreground/40"}`}
          />
        ))}
      </div>
    </section>
  );
}
