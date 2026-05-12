import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Bot, TrendingUp } from "lucide-react";
import ai1 from "@/assets/promo-ai-1.jpg";
import tr1 from "@/assets/promo-traffic-1.jpg";

type Slide = {
  img: string;
  eyebrow: string;
  title: string;
  desc: string;
  cta: string;
  href: string;
  Icon: typeof Bot;
  accent: string;
};

const slides: Slide[] = [
  {
    img: ai1,
    eyebrow: "IA & Automação",
    title: "Automatize sua empresa com IA",
    desc: "Chatbots inteligentes, agentes IA, automações e integrações empresariais.",
    cta: "Solicitar Demonstração",
    href: "#ia",
    Icon: Bot,
    accent: "oklch(0.62 0.22 255)",
  },
  {
    img: tr1,
    eyebrow: "Tráfego Pago",
    title: "Campanhas que geram vendas reais",
    desc: "Meta Ads, Google Ads, funis e estratégias para aumentar conversões.",
    cta: "Ver Planos",
    href: "#trafego",
    Icon: TrendingUp,
    accent: "oklch(0.55 0.25 295)",
  },
];

export default function PromoSliders() {
  const [i, setI] = useState(0);
  const n = slides.length;

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n]);

  const s = slides[i];
  const Icon = s.Icon;

  return (
    <section className="relative w-full overflow-hidden h-[320px]">
      <AnimatePresence mode="sync">
        <motion.img
          key={i}
          src={s.img}
          alt={s.title}
          loading="lazy"
          width={1920}
          height={1080}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1.02 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
      <div
        className="absolute -bottom-24 -left-24 h-[320px] w-[320px] rounded-full blur-[140px] opacity-60"
        style={{ background: s.accent }}
      />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6 lg:px-12">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`t-${i}`}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                <Icon className="h-3.5 w-3.5" style={{ color: s.accent }} />
                <span className="tracking-wide uppercase">{s.eyebrow}</span>
              </div>
              <h3 className="text-2xl sm:text-4xl lg:text-5xl font-bold leading-[1.05] tracking-tight text-white">
                {s.title}
              </h3>
              <p className="max-w-xl text-sm sm:text-base text-white/80 leading-relaxed font-light">
                {s.desc}
              </p>
              <div className="pt-1">
                <a
                  href={s.href}
                  className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.6)] transition hover:scale-[1.04]"
                >
                  {s.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <button
        aria-label="Anterior"
        onClick={() => setI((p) => (p - 1 + n) % n)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 grid place-items-center h-10 w-10 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md transition hover:bg-white/20"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Próximo"
        onClick={() => setI((p) => (p + 1) % n)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 grid place-items-center h-10 w-10 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md transition hover:bg-white/20"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              idx === i ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
