import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Slide = {
  title: string;
  category: string;
  desc: string;
  image: string;
  productId: string;
};

const slides: Slide[] = [
  {
    title: "Identidade Aurora Café",
    category: "Branding Premium",
    desc: "Identidade visual completa com paleta refinada e aplicações em packaging.",
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=900&q=80&auto=format&fit=crop",
    productId: "design-branding-premium",
  },
  {
    title: "Flyer Evento Nexus",
    category: "Flyer Premium",
    desc: "Flyer corporativo para conferência tecnológica com tipografia editorial.",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=900&q=80&auto=format&fit=crop",
    productId: "design-flyer",
  },
  {
    title: "Kit Social Lumière",
    category: "Social Media Kit",
    desc: "10 artes coesas para Instagram com identidade visual sofisticada.",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=900&q=80&auto=format&fit=crop",
    productId: "design-social-kit",
  },
  {
    title: "Logotipo Vertex Studio",
    category: "Logotipo Moderno",
    desc: "Marca minimalista com símbolo geométrico e construção matemática.",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=900&q=80&auto=format&fit=crop",
    productId: "design-branding-premium",
  },
  {
    title: "Mockup Premium Pack",
    category: "Mockups",
    desc: "Apresentação realista da marca em papelaria, app e signage.",
    image: "https://images.unsplash.com/photo-1572044162444-ad60f128bdea?w=900&q=80&auto=format&fit=crop",
    productId: "design-studio",
  },
  {
    title: "Capa YouTube Creator+",
    category: "Capa YouTube",
    desc: "Thumbnail de alta conversão com hierarquia visual otimizada.",
    image: "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=900&q=80&auto=format&fit=crop",
    productId: "design-flyer",
  },
  {
    title: "Banner Campaign Pulse",
    category: "Banner Publicitário",
    desc: "Banners web para campanha multicanal com variações A/B.",
    image: "https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=900&q=80&auto=format&fit=crop",
    productId: "design-flyer",
  },
  {
    title: "Post Patrocinado Nova",
    category: "Instagram Ads",
    desc: "Criativos para anúncios pagos com foco em conversão.",
    image: "https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=900&q=80&auto=format&fit=crop",
    productId: "design-social-kit",
  },
  {
    title: "Branding Atelier Verde",
    category: "Branding Profissional",
    desc: "Identidade orgânica para marca de cosméticos naturais.",
    image: "https://images.unsplash.com/photo-1600250395178-40fe752e5189?w=900&q=80&auto=format&fit=crop",
    productId: "design-branding-premium",
  },
  {
    title: "Flyer Festa Skyline",
    category: "Flyer de Evento",
    desc: "Arte vibrante com tipografia ousada para eventos noturnos.",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80&auto=format&fit=crop",
    productId: "design-flyer",
  },
  {
    title: "Identidade Completa Orion",
    category: "Identidade Visual",
    desc: "Sistema visual escalável com manual de marca e aplicações.",
    image: "https://images.unsplash.com/photo-1634942537034-2531766767d1?w=900&q=80&auto=format&fit=crop",
    productId: "design-studio",
  },
  {
    title: "Artes Premium Insight",
    category: "Direção Criativa",
    desc: "Direção visual com 3 conceitos e mockups realistas.",
    image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=900&q=80&auto=format&fit=crop",
    productId: "design-brand",
  },
];

export default function PortfolioShowcase() {
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
    const t = setInterval(() => setIndex((i) => (i >= max ? 0 : i + 1)), 4000);
    return () => clearInterval(t);
  }, [paused, max]);

  const prev = () => setIndex((i) => (i <= 0 ? max : i - 1));
  const next = () => setIndex((i) => (i >= max ? 0 : i + 1));

  return (
    <section
      className="relative py-24 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.18 0.05 260) 0%, oklch(0.13 0.06 250) 50%, oklch(0.10 0.04 240) 100%)",
      }}
    >
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-primary/30 blur-[140px]" />
        <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-[140px]" />
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
            <ExternalLink className="h-3.5 w-3.5" /> Portfólio Criativo
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Alguns trabalhos que <span className="text-gradient-primary">já criamos</span>
          </h2>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto">
            Flyers premium, branding, social media e identidade visual desenvolvidos pela equipe Viraliza.
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
              animate={{ x: `calc(${-index} * (100% / ${perView}) - ${index} * (24px / ${perView}) * ${perView - 0})` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
    <div className="group relative h-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_-20px_rgba(59,130,246,0.4)] hover:border-white/25">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={slide.image}
          alt={slide.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[10px] uppercase tracking-wider text-white font-semibold">
          {slide.category}
        </span>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-semibold opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
        >
          Ver projeto <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="p-5">
        <h3 className="text-white font-bold text-lg mb-1.5">{slide.title}</h3>
        <p className="text-white/65 text-sm mb-4 line-clamp-2">{slide.desc}</p>
        <Link
          to="/checkout"
          search={{ product: slide.productId }}
          className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:scale-[1.02] transition"
        >
          <ShoppingBag className="h-4 w-4" /> Contratar semelhante
        </Link>
      </div>
    </div>
  );
}

export function ResultsStats() {
  const stats = [
    { value: 500, suffix: "+", label: "Artes criadas" },
    { value: 120, suffix: "+", label: "Clientes atendidos" },
    { value: 3, suffix: "M+", label: "Alcance em campanhas" },
    { value: 98, suffix: "%", label: "Satisfação" },
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
            Resultados que <span className="text-gradient-primary">geram conversão</span>
          </h2>
          <p className="text-muted-foreground">Números reais de quem confia no nosso design.</p>
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
