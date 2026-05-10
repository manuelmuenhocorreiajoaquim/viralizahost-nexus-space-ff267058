import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Server, Bot, TrendingUp, Film } from "lucide-react";
import s1 from "@/assets/hero-servers.jpg";
import s2 from "@/assets/hero-social.jpg";
import s3 from "@/assets/hero-ai.jpg";
import s4 from "@/assets/hero-video.jpg";

const slides = [
  {
    img: s1,
    icon: Server,
    eyebrow: "Hospedagem Cloud",
    title: "Infraestrutura cloud de alta performance",
    desc: "Servidores NVMe, uptime 99.99% e performance global para empresas modernas.",
    cta1: "Ver planos",
    cta2: "Criar website",
  },
  {
    img: s2,
    icon: TrendingUp,
    eyebrow: "Crescimento Digital",
    title: "Aumente sua presença nas redes sociais",
    desc: "Estratégias modernas para crescer sua marca em Instagram, TikTok e YouTube.",
    cta1: "Crescer agora",
    cta2: "Ver cases",
  },
  {
    img: s3,
    icon: Bot,
    eyebrow: "IA & Automação",
    title: "Automatize processos com Inteligência Artificial",
    desc: "Chatbots, agentes autónomos e fluxos n8n que escalam o seu negócio 24/7.",
    cta1: "Falar com IA",
    cta2: "Ver demo",
  },
  {
    img: s4,
    icon: Film,
    eyebrow: "Audiovisual Premium",
    title: "Produção Audiovisual Cinematográfica",
    desc: "Criamos vídeos institucionais, comerciais, podcasts, reels, documentários e conteúdos premium com equipamentos profissionais e qualidade de cinema.",
    cta1: "Ver Produções",
    cta2: "Solicitar Orçamento",
  },
];

export default function Hero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, []);

  const slide = slides[i];

  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      {/* Background slideshow */}
      <AnimatePresence mode="sync">
        <motion.div
          key={`bg-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={slide.img}
            alt={slide.title}
            className="absolute inset-0 h-full w-full object-cover animate-ken-burns"
          />
          {/* Cinematic overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
          {/* Soft blue glow */}
          <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[140px]" />
          <div className="absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-[oklch(0.5_0.25_265/0.35)] blur-[160px]" />
        </motion.div>
      </AnimatePresence>

      {/* Subtle particle grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:42px_42px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 lg:px-12">
        <div className="max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`txt-${i}`}
              initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-7"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                <slide.icon className="h-3.5 w-3.5 text-primary" />
                <span className="tracking-wide uppercase">{slide.eyebrow}</span>
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold leading-[0.98] tracking-tight text-white">
                {slide.title}
              </h1>

              <p className="max-w-xl text-lg sm:text-xl text-white/75 leading-relaxed font-light">
                {slide.desc}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href="#planos"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-[0_10px_40px_-10px_oklch(0.62_0.22_255/0.8)] transition hover:scale-[1.04] hover:shadow-[0_15px_50px_-10px_oklch(0.62_0.22_255/0.95)]"
                >
                  {slide.cta1}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  <Play className="h-4 w-4" />
                  {slide.cta2}
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom bar: indicators + live status */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 lg:px-12 pb-8">
          <div className="flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Ir para slide ${idx + 1}`}
                className={`h-1 rounded-full transition-all duration-500 ${
                  idx === i ? "w-14 bg-white" : "w-6 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-white/85">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Servidores online</span>
            </div>
            <div className="h-4 w-px bg-white/20" />
            <div className="text-xs text-white/70">Latência <span className="text-white font-semibold">12ms</span></div>
            <div className="h-4 w-px bg-white/20" />
            <div className="text-xs text-white/70">Uptime <span className="text-white font-semibold">99.99%</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
