import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Users, Gauge, Film, Bot, Building2, ArrowRight } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import operacional from "@/assets/escritorio-operacional.png";
import podcast from "@/assets/escritorio-podcast.png";

export const Route = createFileRoute("/nosso-escritorio")({
  head: () => ({
    meta: [
      { title: "Nosso Escritório — ViralizaHost" },
      { name: "description", content: "Conheça o ambiente moderno e tecnológico onde a Viraliza desenvolve soluções digitais, marketing, IA e audiovisual." },
      { property: "og:title", content: "Nosso Escritório — ViralizaHost" },
      { property: "og:description", content: "Estrutura premium para marketing, IA, audiovisual e hospedagem." },
    ],
  }),
  component: NossoEscritorioPage,
});

const gallery = [
  {
    src: operacional,
    title: "Centro Operacional Viraliza",
    desc: "Área estratégica para gestão de projetos, marketing digital, automação, hospedagem web e atendimento técnico.",
  },
  {
    src: podcast,
    title: "Sala de Podcast e Produção",
    desc: "Ambiente profissional para gravações, entrevistas, conteúdos institucionais, podcasts e produção audiovisual premium.",
  },
];

const features = [
  { icon: Users, title: "Equipa técnica", desc: "Especialistas em desenvolvimento, suporte e operações 24/7." },
  { icon: Gauge, title: "Alta performance", desc: "Estações de trabalho de alto desempenho e infraestrutura premium." },
  { icon: Film, title: "Produção audiovisual", desc: "Estúdio próprio para vídeos, podcasts e conteúdos cinematográficos." },
  { icon: Bot, title: "Automação e IA", desc: "Laboratório dedicado para agentes, bots e workflows inteligentes." },
];

function NossoEscritorioPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Building2 className="h-3.5 w-3.5" /> Nosso Escritório
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Conheça o ambiente onde a <span className="text-gradient-primary">Viraliza</span> cria soluções digitais
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Um espaço moderno, tecnológico e preparado para desenvolver projetos de marketing, IA, audiovisual, hospedagem e transformação digital.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-20">
            {gallery.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.1 }}
                className="group relative rounded-3xl overflow-hidden border border-border shadow-elegant bg-card"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={g.src}
                    alt={g.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl md:text-2xl font-bold mb-2">{g.title}</h3>
                    <p className="text-sm md:text-base text-white/80">{g.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
              Estrutura preparada para <span className="text-gradient-primary">escalar negócios</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tudo o que precisamos para entregar resultados reais aos nossos clientes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="rounded-2xl bg-card border border-border p-5 hover:border-primary/40 hover:-translate-y-1 transition-all"
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center shadow-glow-soft mb-4">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="font-semibold mb-1">{f.title}</div>
                <div className="text-sm text-muted-foreground">{f.desc}</div>
              </motion.div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/contacto"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-[1.03] transition"
            >
              Quero conhecer a Viraliza <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <CTAFooter />
    </div>
  );
}
