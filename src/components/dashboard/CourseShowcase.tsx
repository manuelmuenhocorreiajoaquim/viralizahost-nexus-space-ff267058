import { useState } from "react";
import { Play, Clock, Sparkles, Flame, X, Brain, Palette, Video, TrendingUp, Server, Megaphone, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import aiImg from "@/assets/courses/ai.jpg";
import designImg from "@/assets/courses/design.jpg";
import audioImg from "@/assets/courses/audiovisual.jpg";
import trafficImg from "@/assets/courses/traffic.jpg";
import hostingImg from "@/assets/courses/hosting.jpg";
import marketingImg from "@/assets/courses/marketing.jpg";

type Course = {
  id: string;
  title: string;
  description: string;
  image: string;
  badge: "NOVO" | "POPULAR";
  duration: string;
  level: "Iniciante" | "Intermediário";
  icon: LucideIcon;
  videoUrl: string;
  accent: string;
};

const COURSES: Course[] = [
  {
    id: "ia",
    title: "Inteligência Artificial",
    description: "Domina ChatGPT, automações e IA aplicada ao teu negócio.",
    image: aiImg,
    badge: "NOVO",
    duration: "4h 30min",
    level: "Intermediário",
    icon: Brain,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    accent: "from-cyan-500 to-blue-600",
  },
  {
    id: "design",
    title: "Design Gráfico",
    description: "Photoshop, Illustrator, branding e identidade visual completa.",
    image: designImg,
    badge: "POPULAR",
    duration: "6h 15min",
    level: "Iniciante",
    icon: Palette,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    accent: "from-fuchsia-500 to-purple-600",
  },
  {
    id: "audiovisual",
    title: "Audiovisual",
    description: "Filmagem profissional, edição cinematográfica e motion graphics.",
    image: audioImg,
    badge: "NOVO",
    duration: "5h 45min",
    level: "Intermediário",
    icon: Video,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    accent: "from-amber-500 to-rose-600",
  },
  {
    id: "trafego",
    title: "Tráfego Pago",
    description: "Meta Ads e Google Ads — campanhas que realmente convertem.",
    image: trafficImg,
    badge: "POPULAR",
    duration: "7h 00min",
    level: "Intermediário",
    icon: TrendingUp,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    accent: "from-rose-500 to-red-600",
  },
  {
    id: "hosting",
    title: "Hospedagem & Servidores",
    description: "WHM, cPanel, VPS, cloud hosting e gestão de servidores.",
    image: hostingImg,
    badge: "NOVO",
    duration: "5h 20min",
    level: "Intermediário",
    icon: Server,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    accent: "from-blue-500 to-indigo-600",
  },
  {
    id: "marketing",
    title: "Marketing Digital",
    description: "Estratégia, redes sociais, analytics e crescimento empresarial.",
    image: marketingImg,
    badge: "POPULAR",
    duration: "8h 10min",
    level: "Iniciante",
    icon: Megaphone,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    accent: "from-pink-500 to-violet-600",
  },
];

export function CourseShowcase() {
  const [active, setActive] = useState<Course | null>(null);

  return (
    <section className="mt-12">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Vitrine de cursos</p>
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-gradient">
            Aprende com os melhores
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            6 trilhas premium — assiste a uma aula demonstrativa agora.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {COURSES.map((c, i) => {
          const Icon = c.icon;
          return (
            <article
              key={c.id}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card card-hover animate-card-rise stagger-${(i % 6) + 1}`}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={c.image}
                  alt={c.title}
                  loading="lazy"
                  width={1024}
                  height={640}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  {c.badge === "NOVO" ? <Sparkles className="h-3 w-3" /> : <Flame className="h-3 w-3" />}
                  {c.badge}
                </div>

                {/* Level */}
                <div className="absolute top-3 right-3 rounded-full bg-black/50 backdrop-blur-md border border-white/20 px-2.5 py-1 text-[10px] font-semibold text-white">
                  {c.level}
                </div>

                {/* Play */}
                <button
                  onClick={() => setActive(c)}
                  aria-label={`Assistir ${c.title}`}
                  className={`absolute inset-0 m-auto h-16 w-16 rounded-full bg-gradient-to-br ${c.accent} text-white shadow-glow flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-500 btn-press`}
                >
                  <Play className="h-7 w-7 fill-white ml-0.5" />
                </button>

                {/* Bottom info */}
                <div className="absolute bottom-0 inset-x-0 p-4 text-white">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`h-7 w-7 rounded-lg bg-gradient-to-br ${c.accent} flex items-center justify-center shadow-md`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="font-display font-semibold text-lg leading-tight">{c.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/80">
                    <Clock className="h-3 w-3" />
                    {c.duration}
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-muted-foreground min-h-[2.5rem]">{c.description}</p>
                <Button
                  onClick={() => setActive(c)}
                  className={`mt-4 w-full bg-gradient-to-r ${c.accent} text-white border-0 shadow-md hover:shadow-glow btn-press`}
                >
                  <Play className="h-4 w-4 fill-white" />
                  Assistir Vídeo
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-white/10">
          <DialogTitle className="sr-only">{active?.title ?? "Demo"}</DialogTitle>
          {active && (
            <div className="animate-card-rise">
              <div className="relative aspect-video bg-black">
                <video
                  key={active.id}
                  src={active.videoUrl}
                  controls
                  autoPlay
                  className="h-full w-full"
                  poster={active.image}
                />
              </div>
              <div className="p-5 bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`h-8 w-8 rounded-lg bg-gradient-to-br ${active.accent} text-white flex items-center justify-center`}>
                    <active.icon className="h-4 w-4" />
                  </span>
                  <h3 className="font-display font-semibold text-lg">{active.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{active.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
