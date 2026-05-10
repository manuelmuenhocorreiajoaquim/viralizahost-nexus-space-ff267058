import { motion } from "framer-motion";
import { Section, SectionHeader } from "./Section";

const locations = [
  { code: "🇧🇷", name: "Brasil", city: "São Paulo", x: "30%", y: "65%" },
  { code: "🇦🇴", name: "Angola", city: "Luanda", x: "52%", y: "62%" },
  { code: "🇵🇹", name: "Portugal", city: "Lisboa", x: "47%", y: "38%" },
  { code: "🇺🇸", name: "EUA", city: "Virginia", x: "22%", y: "40%" },
  { code: "🇫🇷", name: "França", city: "Paris", x: "50%", y: "35%" },
];

export default function GlobalSection() {
  return (
    <Section id="global" className="relative">
      <SectionHeader
        eyebrow="Presença Global"
        title="Infraestrutura em 5 continentes"
        desc="Datacenters Tier IV próximos dos seus clientes para latência mínima."
      />

      <div className="relative aspect-[2/1] rounded-3xl glass overflow-hidden grid-bg">
        <div className="absolute inset-0 bg-gradient-hero" />
        {/* World map silhouette */}
        <svg viewBox="0 0 1000 500" className="absolute inset-0 w-full h-full opacity-30" fill="currentColor">
          <path className="text-primary" d="M150,200 Q200,150 300,180 T500,170 Q600,160 700,190 T900,200 L900,300 Q800,340 700,310 T500,320 Q400,330 300,310 T150,300 Z" />
        </svg>

        {locations.map((l, i) => (
          <motion.div
            key={l.name}
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.15 }}
            className="absolute"
            style={{ left: l.x, top: l.y }}
          >
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              <span className="absolute inset-0 h-4 w-4 rounded-full bg-primary animate-ping" />
              <span className="relative block h-4 w-4 rounded-full bg-gradient-primary shadow-glow ring-2 ring-background" />
              <div className="absolute left-6 top-1/2 -translate-y-1/2 glass rounded-lg px-3 py-1.5 whitespace-nowrap text-xs">
                <span className="mr-1.5">{l.code}</span>
                <span className="font-semibold">{l.name}</span>
                <span className="text-muted-foreground"> · {l.city}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { v: "12ms", l: "Latência média" },
          { v: "99.99%", l: "Uptime SLA" },
          { v: "5", l: "Datacenters" },
          { v: "50+", l: "Países atendidos" },
        ].map((s) => (
          <div key={s.l} className="glass rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-gradient-primary">{s.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}
