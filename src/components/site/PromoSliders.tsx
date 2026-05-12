import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Bot, TrendingUp } from "lucide-react";
import ai1 from "@/assets/promo-ai-1.jpg";
import ai2 from "@/assets/promo-ai-2.jpg";
import tr1 from "@/assets/promo-traffic-1.jpg";
import tr2 from "@/assets/promo-traffic-2.jpg";
import heroAi from "@/assets/hero-ai.jpg";
import heroSocial from "@/assets/hero-social.jpg";

type Slide = {
  img: string;
  eyebrow: string;
  title: string;
  desc: string;
  cta: string;
  href: string;
};

function Slider({
  slides,
  Icon,
  accent,
  interval = 5500,
}: {
  slides: Slide[];
  Icon: typeof Bot;
  accent: string;
  interval?: number;
}) {
  const [i, setI] = useState(0);
  const n = slides.length;

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % n), interval);
    return () => clearInterval(t);
  }, [n, interval]);

  const s = slides[i];

  return (
    <div
      className="relative w-full overflow-hidden h-[420px] sm:h-[460px] lg:h-[500px] shadow-elegant"
      style={{ borderRadius: 28 }}
    >
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
          transition={{ duration: 1.4, ease: "easeInOut" }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>

      {/* Cinematic overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
      <div
        className="absolute -bottom-24 -left-24 h-[360px] w-[360px] rounded-full blur-[140px] opacity-60"
        style={{ background: accent }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center px-6 sm:px-12 lg:px-16">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`t-${i}`}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-5"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                <span className="tracking-wide uppercase">{s.eyebrow}</span>
              </div>
              <h3 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1] tracking-tight text-white">
                {s.title}
              </h3>
              <p className="max-w-xl text-base sm:text-lg text-white/80 leading-relaxed font-light">
                {s.desc}
              </p>
              <div className="pt-2">
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

      {/* Nav */}
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

      {/* Indicators */}
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
    </div>
  );
}

const aiSlides: Slide[] = [
  {
    img: ai1,
    eyebrow: "IA Empresarial",
    title: "Agentes de IA que trabalham 24/7",
    desc: "Implementamos chatbots inteligentes, automações n8n e agentes autónomos que reduzem custos e escalam o seu negócio.",
    cta: "Falar com especialista",
    href: "#ia",
  },
  {
    img: ai2,
    eyebrow: "Chatbots Premium",
    title: "Atendimento automatizado de alta conversão",
    desc: "Bots integrados ao WhatsApp, Instagram e site, treinados com a sua marca para converter leads em clientes.",
    cta: "Ver planos de IA",
    href: "#ia",
  },
  {
    img: heroAi,
    eyebrow: "Automação n8n",
    title: "Conecte tudo. Automatize tudo.",
    desc: "Workflows poderosos integrando CRM, e-mail, redes sociais e APIs para libertar a sua equipa de tarefas repetitivas.",
    cta: "Começar agora",
    href: "#ia",
  },
];

const trafficSlides: Slide[] = [
  {
    img: tr1,
    eyebrow: "Performance Marketing",
    title: "Tráfego pago que gera ROI real",
    desc: "Campanhas Meta Ads, Google Ads e TikTok Ads com gestão estratégica, criativos premium e otimização contínua.",
    cta: "Quero escalar agora",
    href: "#trafego",
  },
  {
    img: tr2,
    eyebrow: "Crescimento Digital",
    title: "Multiplique vendas e leads qualificadas",
    desc: "Funis completos de aquisição, remarketing inteligente e relatórios transparentes que mostram cada real investido.",
    cta: "Ver planos de tráfego",
    href: "#trafego",
  },
  {
    img: heroSocial,
    eyebrow: "Social Growth",
    title: "Domine Instagram, TikTok e YouTube",
    desc: "Estratégias modernas de conteúdo, anúncios e branding para crescer comunidades reais e engajadas.",
    cta: "Crescer agora",
    href: "#trafego",
  },
];

export default function PromoSliders() {
  return (
    <section className="relative py-20 bg-background">
      <div className="mx-auto max-w-[1400px] px-4 lg:px-8 space-y-10">
        <Slider slides={aiSlides} Icon={Bot} accent="oklch(0.62 0.22 255)" />
        <Slider slides={trafficSlides} Icon={TrendingUp} accent="oklch(0.55 0.25 295)" interval={6000} />
      </div>
    </section>
  );
}
