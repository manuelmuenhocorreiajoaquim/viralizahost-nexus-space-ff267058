import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Section, SectionHeader } from "./Section";

const reviews = [
  { name: "Mariana Costa", role: "CEO, Nova Tech", text: "Migrámos 40 sites para a ViralizaHost — performance subiu 3x e o suporte é instantâneo." },
  { name: "Ricardo Almeida", role: "CTO, FinPay", text: "A integração de IA com o nosso CRM economizou 200h/mês. Solução de outro nível." },
  { name: "Sofia Mendes", role: "Founder, BrandLab", text: "O design e o audiovisual elevaram a marca para padrão internacional. Recomendo." },
  { name: "André Pereira", role: "Diretor, MaxAds", text: "Tráfego pago e funis impecáveis. ROI multiplicou em 4 meses." },
  { name: "Carla Nunes", role: "CMO, Healthly", text: "Crescimento orgânico no Instagram de 12K para 180K em 8 meses. Surreal." },
  { name: "Tiago Rocha", role: "Owner, Studio7", text: "VPS NVMe absurdamente rápido. Migrei do AWS e cortei 60% do custo." },
];

export default function Testimonials() {
  return (
    <Section id="clientes">
      <SectionHeader
        eyebrow="Clientes & Cases"
        title="Empresas que escalam connosco"
        desc="Mais de 12.000 marcas confiam na ViralizaHost para crescer."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="glass rounded-2xl p-6 hover:shadow-glow-soft transition relative"
          >
            <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-primary text-primary" />)}
            </div>
            <p className="text-sm text-foreground/85 mb-5 leading-relaxed">"{r.text}"</p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground font-bold text-sm shadow-glow">
                {r.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="text-sm font-semibold">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
