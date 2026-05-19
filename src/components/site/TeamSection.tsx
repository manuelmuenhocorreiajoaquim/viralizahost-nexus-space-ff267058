import { motion } from "framer-motion";
import {
  Users, Target, Lightbulb, TrendingUp, Palette, Bot, Server, Share2, Video,
  Rocket, Eye, Heart, Crown,
} from "lucide-react";
import manuel from "@/assets/team/manuel.jpeg";
import lucas from "@/assets/team/lucas.jpeg";
import jacob from "@/assets/team/jacob.jpeg";
import felipe from "@/assets/team/felipe.png";
import vladmiro from "@/assets/team/vladimiro.png";
import israel from "@/assets/team/israel.png";
import arnaldo from "@/assets/team/arnaldo.jpeg";

const AO = "https://flagcdn.com/w80/ao.png";
const BR = "https://flagcdn.com/w80/br.png";

const team = [
  { photo: lucas,    name: "Lucas Marcelino",  role: "Tráfego Pago",                 icon: TrendingUp, desc: "Especialista em Meta Ads, Google Ads e estratégias de conversão e crescimento digital.", flag: BR, country: "Brasil" },
  { photo: jacob,    name: "Jacob Pessela",    role: "Design Gráfico",               icon: Palette,    desc: "Especialista em branding, identidade visual e comunicação criativa empresarial.", flag: AO, country: "Angola" },
  { photo: felipe,   name: "Felipe Nóbrega",   role: "Automação IA",                 icon: Bot,        desc: "Especialista em Inteligência Artificial, automação de processos e soluções inteligentes.", flag: BR, country: "Brasil" },
  { photo: vladmiro, name: "Vladimiro Francisco", role: "Hosting & Infraestrutura",   icon: Server,     desc: "Especialista em servidores web, cloud hosting, e-mails corporativos e infraestrutura.", flag: AO, country: "Angola" },
  { photo: israel,   name: "Israel Soares",    role: "Crescimento Digital",          icon: Share2,     desc: "Especialista em crescimento digital, estratégias sociais e posicionamento online.", flag: BR, country: "Brasil" },
  { photo: arnaldo,  name: "Arnaldo Eduardo",  role: "Audiovisual",                  icon: Video,      desc: "Especialista em produção audiovisual, motion graphics e conteúdos digitais premium.", flag: AO, country: "Angola" },
];

const stats = [
  { icon: Users,      n: "7", t: "Especialistas",      s: "Profissionais dedicados" },
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
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(59,169,255,0.25) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <style>{`
        @keyframes lineFlow {
          0% { stroke-dashoffset: 200; opacity: 0.4; }
          50% { opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.4; }
        }
        .org-line { stroke-dasharray: 8 12; animation: lineFlow 3s linear infinite; }
        .team-photo { image-rendering: auto; -webkit-backface-visibility: hidden; backface-visibility: hidden; transform: translateZ(0); }
        @keyframes dashSpin { to { stroke-dashoffset: -100; } }
        .dashed-ring { animation: dashSpin 6s linear infinite; filter: drop-shadow(0 0 6px rgba(59,169,255,0.7)); }
        .flag-badge {
          width: 28px; height: 28px; border-radius: 999px;
          border: 1.5px solid rgba(59,169,255,0.75);
          box-shadow: 0 0 12px rgba(59,169,255,0.55);
          object-fit: cover; background: #0b1220;
        }
        /* Hierarchy connector lines (dashed + animated energy flow) */
        @keyframes hFlow { to { background-position: 24px 0; } }
        @keyframes vFlow { to { background-position: 0 24px; } }
        .org-h {
          height: 2px;
          background-image: linear-gradient(to right, #3BA9FF 60%, transparent 40%);
          background-size: 12px 2px;
          background-repeat: repeat-x;
          filter: drop-shadow(0 0 6px rgba(59,169,255,0.85));
          animation: hFlow 1.6s linear infinite;
        }
        .org-v {
          width: 2px;
          background-image: linear-gradient(to bottom, #3BA9FF 60%, transparent 40%);
          background-size: 2px 12px;
          background-repeat: repeat-y;
          filter: drop-shadow(0 0 6px rgba(59,169,255,0.85));
          animation: vFlow 1.6s linear infinite;
        }
        .org-node {
          width: 10px; height: 10px; border-radius: 999px;
          background: #3BA9FF;
          box-shadow: 0 0 12px rgba(59,169,255,0.9), 0 0 22px rgba(59,169,255,0.5);
        }
      `}</style>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        {/* Header chip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 rounded-full border border-[#3BA9FF]/40 bg-[#3BA9FF]/10 text-[#3BA9FF] text-xs font-semibold tracking-[0.2em] uppercase">
            Estrutura Organizacional
          </span>
        </motion.div>

        {/* Top row: intro | CEO | stats */}
        <div className="grid lg:grid-cols-12 gap-8 mb-12 items-stretch">
          {/* Intro */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="lg:col-span-3 flex flex-col justify-center"
          >
            <h2
              className="text-[2.5rem] lg:text-[3.25rem] font-bold text-white"
              style={{ lineHeight: 1.05, letterSpacing: "-0.02em" }}
            >
              Liderança que<br />
              move o<br />
              <span className="text-[#3BA9FF]">futuro.</span>
            </h2>
            <p className="mt-5 text-white/70 text-sm leading-relaxed">
              Uma equipa especializada, alinhada e focada em inovação, performance e resultados reais para empresas em{" "}
              <span className="text-[#3BA9FF] font-semibold">Angola</span> e{" "}
              <span className="text-[#3BA9FF] font-semibold">Brasil</span>.
            </p>
          </motion.div>

          {/* CEO Card — bigger, premium */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="lg:col-span-6"
          >
            <div className="relative rounded-3xl p-8 md:p-10 border border-[#3BA9FF]/40 bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-xl shadow-[0_0_80px_-15px_rgba(59,169,255,0.55)] overflow-hidden">
              {/* corner glow */}
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#3BA9FF]/30 blur-3xl" />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#7B5BFF]/25 blur-3xl" />

              {/* country flag */}
              <img
                src={AO} alt="Angola" title="Angola 🇦🇴"
                className="flag-badge absolute top-4 right-4 z-10"
              />

              <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start">
                <div className="relative shrink-0 h-56 w-56 grid place-items-center">
                  <div className="absolute inset-0 rounded-full bg-[#3BA9FF]/30 blur-2xl" />
                  {/* dashed animated ring */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
                    <circle cx="50" cy="50" r="48" fill="none" stroke="#3BA9FF" strokeWidth="1.2"
                      strokeDasharray="4 6" className="dashed-ring" />
                  </svg>
                  <img
                    src={manuel} alt="Manuel Muenho"
                    loading="eager" decoding="async"
                    className="team-photo relative h-44 w-44 rounded-full object-cover object-center border-2 border-[#3BA9FF]/60 shadow-[0_0_50px_-10px_rgba(59,169,255,0.7)]"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3BA9FF]/15 border border-[#3BA9FF]/40 text-[#3BA9FF] text-[11px] font-bold tracking-widest mb-3">
                    <Crown className="h-3.5 w-3.5" /> CEO &amp; FUNDADOR
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-1" style={{ letterSpacing: "-0.02em" }}>
                    Manuel Muenho
                  </h3>
                  <p className="text-white/55 text-sm mb-4">CEO &amp; Fundador da ViralizaHost</p>
                  <p className="text-white/80 text-sm leading-relaxed max-w-md">
                    Especialista em Tecnologia, Gestão de Projetos, Infraestrutura Digital e Transformação Tecnológica.
                    Lidera a expansão internacional da ViralizaHost com visão estratégica e excelência operacional.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="lg:col-span-3"
          >
            <div className="h-full rounded-3xl p-6 border border-white/10 bg-white/[0.03] backdrop-blur-xl flex flex-col justify-center gap-5">
              {stats.map((s) => (
                <div key={s.t} className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#3BA9FF]/15 border border-[#3BA9FF]/30 grid place-items-center shrink-0">
                    <s.icon className="h-5 w-5 text-[#3BA9FF]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white leading-none">
                      {s.n} <span className="text-sm font-medium text-white/80">{s.t}</span>
                    </div>
                    <div className="text-xs text-white/55 mt-1">{s.s}</div>
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t border-white/10 text-xs text-white/60">
                <span className="text-[#3BA9FF] font-semibold">Expansão</span> · Angola &amp; Brasil
              </div>
            </div>
          </motion.div>
        </div>

        {/* Hierarchy connector (desktop only) — full dashed network: CEO → trunk → specialists */}
        <div className="relative hidden lg:block h-24 mb-2" aria-hidden>
          {/* vertical from CEO down to trunk */}
          <div className="org-v absolute left-1/2 -translate-x-1/2 top-0 h-12" />
          {/* node at CEO connection */}
          <div className="org-node absolute left-1/2 -translate-x-1/2 top-[-5px]" />
          {/* horizontal trunk — spans the 6 column centers */}
          <div
            className="org-h absolute top-12"
            style={{ left: "8.333%", right: "8.333%" }}
          />
          {/* node where vertical meets trunk */}
          <div className="org-node absolute left-1/2 -translate-x-1/2 top-[42px]" />
          {/* vertical drops to each of the 6 specialist cards (centers at 1/12, 3/12, ... 11/12) */}
          {[8.333, 25, 41.667, 58.333, 75, 91.667].map((leftPct) => (
            <div key={leftPct}>
              <div
                className="org-v absolute top-12 h-12"
                style={{ left: `${leftPct}%`, transform: "translateX(-1px)" }}
              />
              <div
                className="org-node absolute top-[42px]"
                style={{ left: `${leftPct}%`, transform: "translate(-50%, 0)", width: 8, height: 8 }}
              />
            </div>
          ))}
        </div>

        {/* Team grid — equal cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">
          {team.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group relative rounded-2xl p-5 border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:border-[#3BA9FF]/60 hover:-translate-y-2 hover:shadow-[0_0_50px_-10px_rgba(59,169,255,0.6)] transition-all flex flex-col h-full overflow-hidden"
            >
              {/* light sweep */}
              <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              {/* country flag */}
              <img
                src={m.flag} alt={m.country} title={`${m.country} ${m.flag === AO ? "🇦🇴" : "🇧🇷"}`}
                className="flag-badge absolute top-3 right-3 z-10"
              />

              <div className="flex justify-center mb-4">
                <div className="relative h-32 w-32 grid place-items-center">
                  <div className="absolute inset-0 rounded-full bg-[#3BA9FF]/40 blur-lg group-hover:bg-[#3BA9FF]/60 transition" />
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
                    <circle cx="50" cy="50" r="48" fill="none" stroke="#3BA9FF" strokeWidth="1.4"
                      strokeDasharray="4 6" className="dashed-ring" />
                  </svg>
                  <img
                    src={m.photo} alt={m.name}
                    loading="lazy" decoding="async"
                    className="team-photo relative h-28 w-28 rounded-full object-cover object-center border-2 border-[#3BA9FF]/60 shadow-[0_0_25px_-5px_rgba(59,169,255,0.6)]"
                  />
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold tracking-[0.15em] text-[#3BA9FF] uppercase mb-2">
                <m.icon className="h-3.5 w-3.5" /> {m.role}
              </div>
              <h4 className="text-center text-base font-bold mb-1">{m.name}</h4>
              <p className="text-center text-[11px] text-white/55 mb-3">Especialista</p>
              <p className="text-xs text-white/70 leading-relaxed text-center mt-auto">{m.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Pillars */}
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
