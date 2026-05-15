import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Film,
  Camera,
  Mic,
  Video,
  Clapperboard,
  Lightbulb,
  PenTool,
  Scissors,
  Sparkles,
  Send,
  Aperture,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

type Slide = {
  title: string;
  category: string;
  desc: string;
  duration: string;
  image: string;
  productId: string;
};

const slides: Slide[] = [
  {
    title: "Reels Aurora Beauty",
    category: "Reels Profissional",
    desc: "Reels vertical com captação 4K, color grading e legendas dinâmicas.",
    duration: "0:45",
    image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1100&q=80&auto=format&fit=crop",
    productId: "av-reels-prof",
  },
  {
    title: "Institucional Vertex Tech",
    category: "Vídeo Institucional",
    desc: "Roteiro estratégico, captação cinematográfica e direção criativa premium.",
    duration: "2:30",
    image: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1100&q=80&auto=format&fit=crop",
    productId: "av-institutional",
  },
  {
    title: "Cobertura Summit 2025",
    category: "Cobertura de Evento",
    desc: "Aftermovie multi-câmera com edição dinâmica e foto profissional.",
    duration: "3:15",
    image: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1100&q=80&auto=format&fit=crop",
    productId: "av-event",
  },
  {
    title: "VSL Conversão Pro",
    category: "VSL Premium",
    desc: "Roteiro de vendas com storytelling e edição otimizada para tráfego.",
    duration: "5:20",
    image: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=1100&q=80&auto=format&fit=crop",
    productId: "av-vsl",
  },
  {
    title: "Podcast Founders Talk",
    category: "Podcast",
    desc: "Captação multicâmera em estúdio com áudio profissional e cortes verticais.",
    duration: "42:00",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1100&q=80&auto=format&fit=crop",
    productId: "av-studio",
  },
  {
    title: "Entrevista CEO Insight",
    category: "Entrevista",
    desc: "Cenário cinematográfico com iluminação profissional e direção de imagem.",
    duration: "8:10",
    image: "https://images.unsplash.com/photo-1573164713988-8665fc963095?w=1100&q=80&auto=format&fit=crop",
    productId: "av-institutional",
  },
  {
    title: "YouTube Creator Series",
    category: "Produção YouTube",
    desc: "Pacote mensal com roteiro, edição premium e thumbnails de alta conversão.",
    duration: "12:45",
    image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=1100&q=80&auto=format&fit=crop",
    productId: "av-reels",
  },
  {
    title: "Comercial Pulse Ads",
    category: "Comercial Social",
    desc: "Comerciais curtos para Meta Ads e TikTok com foco em performance.",
    duration: "0:30",
    image: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=1100&q=80&auto=format&fit=crop",
    productId: "av-reels",
  },
  {
    title: "Captação Aérea Skyline",
    category: "Drone 4K",
    desc: "Imagens aéreas cinematográficas com drones profissionais e estabilização.",
    duration: "1:50",
    image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1100&q=80&auto=format&fit=crop",
    productId: "av-event",
  },
  {
    title: "Estúdio Audiovisual Lumen",
    category: "Studio",
    desc: "Produção completa em estúdio com cenários modulares e equipe dedicada.",
    duration: "—",
    image: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=1100&q=80&auto=format&fit=crop",
    productId: "av-studio",
  },
  {
    title: "Bastidores Campanha Nova",
    category: "Bastidores",
    desc: "Conteúdo making-of para fortalecer marca e engajar audiência.",
    duration: "1:20",
    image: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=1100&q=80&auto=format&fit=crop",
    productId: "av-reels",
  },
  {
    title: "Conteúdo Empresarial Orion",
    category: "Corporate",
    desc: "Série de vídeos corporativos com narrativa institucional e brand storytelling.",
    duration: "4:00",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1100&q=80&auto=format&fit=crop",
    productId: "av-institutional",
  },
];

export default function AudiovisualShowcase() {
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(3);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerView(w < 640 ? 1 : w < 1024 ? 2 : 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const max = Math.max(slides.length - perView, 0);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i >= max ? 0 : i + 1)), 5000);
    return () => clearInterval(t);
  }, [paused, max]);

  const prev = () => setIndex((i) => (i <= 0 ? max : i - 1));
  const next = () => setIndex((i) => (i >= max ? 0 : i + 1));

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.10 0.03 260) 0%, oklch(0.08 0.04 250) 50%, oklch(0.06 0.02 240) 100%)",
      }}
    >
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/40 blur-[160px]" />
        <div className="absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-accent/30 blur-[160px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-xs font-semibold mb-4">
            <Film className="h-3.5 w-3.5" /> Portfólio Audiovisual
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Produções audiovisuais que <span className="text-gradient-primary">geram impacto</span>
          </h2>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto">
            Vídeos institucionais, reels, publicidade e conteúdos premium produzidos com qualidade cinematográfica.
          </p>
        </motion.div>

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-6"
              animate={{ x: `calc(${-index} * (100% / ${perView}) - ${index} * (24px / ${perView}) * ${perView})` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "100%" }}
            >
              {slides.map((s, i) => (
                <div
                  key={i}
                  className="shrink-0"
                  style={{ width: `calc((100% - ${(perView - 1) * 24}px) / ${perView})` }}
                >
                  <SlideCard slide={s} />
                </div>
              ))}
            </motion.div>
          </div>

          <button
            aria-label="Anterior"
            onClick={prev}
            className="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 z-10 grid place-items-center h-11 w-11 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-110"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Próximo"
            onClick={next}
            className="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 z-10 grid place-items-center h-11 w-11 rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-md transition hover:bg-white/20 hover:scale-110"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: max + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ir para slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? "w-10 bg-white" : "w-4 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function SlideCard({ slide }: { slide: Slide }) {
  return (
    <div className="group relative h-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_-20px_rgba(0,0,0,0.7)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_90px_-15px_rgba(59,130,246,0.55)] hover:border-primary/40">
      <div className="relative aspect-video overflow-hidden">
        <img
          src={slide.image}
          alt={slide.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] uppercase tracking-wider text-white font-semibold">
          {slide.category}
        </span>
        <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] tabular-nums text-white/90 font-mono border border-white/10">
          {slide.duration}
        </span>

        <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="h-16 w-16 rounded-full bg-white/95 grid place-items-center shadow-[0_0_40px_rgba(59,130,246,0.6)]">
            <Play className="h-7 w-7 text-slate-900 fill-slate-900 translate-x-0.5" />
          </div>
        </div>
      </div>
      <div className="p-5">
        <h3 className="text-white font-bold text-lg mb-1.5">{slide.title}</h3>
        <p className="text-white/65 text-sm mb-4 line-clamp-2">{slide.desc}</p>
        <Link
          to="/checkout"
          search={{ product: slide.productId }}
          className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:scale-[1.02] transition"
        >
          <Sparkles className="h-4 w-4" /> Quero um igual
        </Link>
      </div>
    </div>
  );
}

const processSteps = [
  { icon: Lightbulb, title: "Briefing", desc: "Entendemos sua marca, público e objetivos do projeto." },
  { icon: PenTool, title: "Roteiro", desc: "Criação de roteiro estratégico e storyboard visual." },
  { icon: Camera, title: "Captação", desc: "Filmagem 4K com equipe e equipamentos profissionais." },
  { icon: Scissors, title: "Edição", desc: "Montagem dinâmica com ritmo cinematográfico." },
  { icon: Sparkles, title: "Pós-produção", desc: "Color grading, motion graphics, trilha e mixagem." },
  { icon: Send, title: "Entrega final", desc: "Múltiplos formatos otimizados para cada canal." },
];

export function CreativeProcess() {
  return (
    <section className="relative py-24 bg-background overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary blur-[120px]" />
      </div>
      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <Clapperboard className="h-3.5 w-3.5" /> Processo Criativo
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            Nosso <span className="text-gradient-primary">processo criativo</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Da ideia à entrega final, cada etapa é executada com método e qualidade premium.
          </p>
        </motion.div>

        <div className="relative">
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="h-px origin-left bg-gradient-to-r from-transparent via-primary/60 to-transparent"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
            {processSteps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="text-center"
              >
                <div className="relative mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-primary grid place-items-center shadow-glow">
                  <s.icon className="h-7 w-7 text-primary-foreground" />
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-background border border-primary/40 grid place-items-center text-[11px] font-bold text-primary">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-1.5">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function AudiovisualStats() {
  const stats = [
    { value: 300, suffix: "+", label: "Vídeos produzidos" },
    { value: 50, suffix: "+", label: "Marcas atendidas" },
    { value: 20, suffix: "M+", label: "Visualizações geradas" },
    { value: 95, suffix: "%", label: "Clientes recorrentes" },
  ];
  return (
    <section className="relative py-20 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            Nossos <span className="text-gradient-primary">números</span>
          </h2>
          <p className="text-muted-foreground">Resultados reais de uma equipe audiovisual premium.</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative rounded-2xl p-6 text-center bg-card border border-border shadow-card hover:shadow-glow-soft transition-all hover:-translate-y-1"
    >
      <div className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2 tabular-nums">
        +{n}
        {suffix}
      </div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </motion.div>
  );
}

const galleryImages = [
  { src: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=900&q=80&auto=format&fit=crop", h: "h-72", icon: Camera, label: "Câmera RED" },
  { src: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=900&q=80&auto=format&fit=crop", h: "h-56", icon: Video, label: "Estúdio" },
  { src: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=900&q=80&auto=format&fit=crop", h: "h-64", icon: Mic, label: "Podcast" },
  { src: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=900&q=80&auto=format&fit=crop", h: "h-80", icon: Aperture, label: "Drone aéreo" },
  { src: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?w=900&q=80&auto=format&fit=crop", h: "h-56", icon: Clapperboard, label: "Bastidores" },
  { src: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=900&q=80&auto=format&fit=crop", h: "h-72", icon: Film, label: "Captação externa" },
  { src: "https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=900&q=80&auto=format&fit=crop", h: "h-64", icon: Camera, label: "Cobertura evento" },
  { src: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=900&q=80&auto=format&fit=crop", h: "h-56", icon: Video, label: "Corporativo" },
];

export function EquipmentGallery() {
  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.10 0.03 260) 0%, oklch(0.07 0.03 250) 100%)",
      }}
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-primary/40 blur-[160px]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-white/90 text-xs font-semibold mb-4">
            <Aperture className="h-3.5 w-3.5" /> Equipamentos & Bastidores
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            Estrutura <span className="text-gradient-primary">profissional</span>
          </h2>
          <p className="text-white/70 max-w-xl mx-auto">
            Câmeras 4K, drones, estúdio próprio e equipe especializada em produção audiovisual premium.
          </p>
        </motion.div>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
          {galleryImages.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.05 }}
              className={`group relative mb-4 break-inside-avoid rounded-xl overflow-hidden border border-white/10 ${g.h}`}
            >
              <img
                src={g.src}
                alt={g.label}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                <div className="h-7 w-7 rounded-full bg-white/15 backdrop-blur-md grid place-items-center border border-white/20">
                  <g.icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold tracking-wide">{g.label}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
