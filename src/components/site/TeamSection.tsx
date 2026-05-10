import { motion } from "framer-motion";
import {
  Users, Target, Lightbulb, TrendingUp, Palette, Bot, Server, Share2, Video,
  Rocket, Eye, Heart, Crown,
} from "lucide-react";
import manuel from "@/assets/team/manuel.jpeg";
import lucas from "@/assets/team/lucas.jpeg";
import jacob from "@/assets/team/jacob.jpeg";
import felipe from "@/assets/team/felipe.png";
import vladmiro from "@/assets/team/vladmiro.jpeg";
import israel from "@/assets/team/israel.png";
import arnaldo from "@/assets/team/arnaldo.jpeg";

const team = [
  { photo: lucas,    name: "Lucas Marcelino",  role: "Tráfego Pago",                 icon: TrendingUp, desc: "Especialista em Meta Ads, Google Ads e estratégias de conversão e crescimento digital." },
  { photo: jacob,    name: "Jacob Pessela",    role: "Design Gráfico",               icon: Palette,    desc: "Especialista em branding, identidade visual e comunicação criativa empresarial." },
  { photo: felipe,   name: "Felipe Nóbrega",   role: "Automação IA",                 icon: Bot,        desc: "Especialista em Inteligência Artificial, automação de processos e soluções inteligentes." },
  { photo: vladmiro, name: "Vladmiro Macedo",  role: "Hosting & Infraestrutura",     icon: Server,     desc: "Especialista em servidores web, cloud hosting, e-mails corporativos e infraestrutura." },
  { photo: israel,   name: "Israel Soares",    role: "Crescimento de Redes Sociais", icon: Share2,     desc: "Especialista em crescimento digital, estratégias sociais e posicionamento online." },
  { photo: arnaldo,  name: "Arnaldo Eduardo",  role: "Audiovisual",                  icon: Video,      desc: "Especialista em produção audiovisual, motion graphics e conteúdos digitais premium." },
];

const stats = [
  { icon: Users,      n: "7", t: "Especialistas",     s: "Profissionais dedicados" },
  { icon: Target,     n: "6", t: "Áreas Estratégicas", s: "Cobertura completa" },
  { icon: Lightbulb,  n: "1", t: "Visão",              s: "Resultados extraordinários" },
];

const pillars = [
  { icon: Rocket, t: "Missão",  d: "Transformar ideias em presença digital, tecnologia e resultados." },
  { icon: Eye,    t: "Visão",   d: "Ser referência em soluções digitais em Angola, Brasil e no mundo." },
  { icon: Target, t: "Valores", d: "Inovação, ética, excelência, compromisso e resultados sustentáveis." },
  { icon: Heart,  t: "Cultura", d: "Foco em pessoas, aprendizado contínuo e crescimento colaborativo." },
];

export default function TeamSection() {
  return (
    <section id="equipe" className="relative py-28 overflow-hidden bg-[oklch(0.13_0.04_255)] text-white">
      {/* glows */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute top-1/4 -left-24 h-96 w-96 rounded-full blur-3xl bg-[oklch(0.6_0.2_250/0.25)]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full blur-3xl bg-[oklch(0.55_0.22_265/0.2)]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(59,169,255,0.25) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header row: intro + CEO + stats */}
        <div className="grid lg:grid-cols-12 gap-8 mb-16">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-[#3BA9FF]/40 bg-[#3BA9FF]/10 text-[#3BA9FF] text-xs font-semibold tracking-wider mb-5">
              ESTRUTURA ORGANIZACIONAL
            </span>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
              Liderança que <br /> move o <span className="text-[#3BA9FF]">futuro.</span>
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              Uma equipa especializada, alinhada e focada em inovação, performance e
              resultados reais para transformar a presença digital de empresas em{" "}
              <span className="text-[#3BA9FF] font-semibold">Angola</span> e{" "}
              <span className="text-[#3BA9FF] font-semibold">Brasil</span>.
            </p>
          </motion.div>

          {/* CEO Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="lg:col-span-6"
          >
            <div className="relative rounded-3xl p-6 md:p-8 border border-[#3BA9FF]/30 bg-white/[0.03] backdrop-blur-xl shadow-[0_0_60px_-15px_rgba(59,169,255,0.4)]">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <img
                  src={manuel} alt="Manuel Muenho"
                  className="h-44 w-44 rounded-2xl object-cover border-2 border-[#3BA9FF]/40 shadow-[0_0_40px_-10px_rgba(59,169,255,0.6)]"
                />
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 text-[#3BA9FF] text-xs font-semibold mb-2">
                    <Crown className="h-4 w-4" /> CEO & FUNDADOR
                  </div>
                  <h3 className="text-3xl font-bold mb-1">Manuel Muenho</h3>
                  <p className="text-white/60 text-sm mb-3">CEO & Fundador da ViralizaHost</p>
                  <p className="text-white/75 text-sm leading-relaxed">
                    Especialista em Tecnologia, Gestão de Projetos, Infraestrutura
                    Digital e Transformação Tecnológica.
                  </p>
                  <p className="mt-4 italic text-[#3BA9FF]/90 text-lg" style={{ fontFamily: "cursive" }}>
                    Manuel Muenho
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <div className="rounded-3xl p-6 border border-white/10 bg-white/[0.03] backdrop-blur-xl space-y-5">
              {stats.map((s) => (
                <div key={s.t} className="flex items-start gap-4">
                  <div className="h-11 w-11 rounded-xl bg-[#3BA9FF]/15 border border-[#3BA9FF]/30 grid place-items-center shrink-0">
                    <s.icon className="h-5 w-5 text-[#3BA9FF]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{s.n} <span className="text-sm font-medium text-white/80">{s.t}</span></div>
                    <div className="text-xs text-white/55">{s.s}</div>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-white/10 text-xs text-white/60">
                <span className="text-[#3BA9FF] font-semibold">Expansão</span> Angola & Brasil
              </div>
            </div>
          </motion.div>
        </div>

        {/* Connector lines (desktop) */}
        <div className="relative hidden lg:block h-16">
          <div className="absolute left-1/2 top-0 h-8 w-px bg-gradient-to-b from-[#3BA9FF] to-[#3BA9FF]/20" />
          <div className="absolute left-[8%] right-[8%] top-8 h-px bg-gradient-to-r from-transparent via-[#3BA9FF]/60 to-transparent" />
          {[8, 24, 40, 56, 72, 88].map((l) => (
            <div key={l} className="absolute top-8 h-8 w-px bg-gradient-to-b from-[#3BA9FF]/60 to-[#3BA9FF]/10" style={{ left: `${l + 4}%` }} />
          ))}
        </div>

        {/* Team grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
          {team.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group relative rounded-2xl p-5 border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:border-[#3BA9FF]/50 hover:-translate-y-2 hover:shadow-[0_0_40px_-10px_rgba(59,169,255,0.5)] transition-all"
            >
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#3BA9FF]/30 blur-xl group-hover:bg-[#3BA9FF]/50 transition" />
                  <img
                    src={m.photo} alt={m.name}
                    className="relative h-24 w-24 rounded-full object-cover border-2 border-[#3BA9FF]/50"
                  />
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold tracking-wider text-[#3BA9FF] uppercase mb-2">
                <m.icon className="h-3.5 w-3.5" /> {m.role}
              </div>
              <h4 className="text-center text-base font-bold mb-1">{m.name}</h4>
              <p className="text-center text-[11px] text-white/55 mb-3">Especialista em {m.role}</p>
              <p className="text-xs text-white/70 leading-relaxed text-center">{m.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Pillars bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="mt-12 rounded-2xl border border-[#3BA9FF]/20 bg-white/[0.03] backdrop-blur-xl p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {pillars.map((p) => (
            <div key={p.t} className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#3BA9FF]/15 border border-[#3BA9FF]/30 grid place-items-center shrink-0">
                <p.icon className="h-5 w-5 text-[#3BA9FF]" />
              </div>
              <div>
                <div className="font-semibold mb-1">{p.t}</div>
                <p className="text-xs text-white/65 leading-relaxed">{p.d}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
