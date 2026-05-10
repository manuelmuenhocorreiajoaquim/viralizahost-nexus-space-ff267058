import { motion } from "framer-motion";
import { Check, ArrowRight, type LucideIcon } from "lucide-react";
import { Section, SectionHeader } from "./Section";
import { usePrice } from "@/lib/currency";

export type Plan = {
  icon: LucideIcon;
  name: string;
  price: string;
  per?: string;
  tag?: string;
  features: string[];
  popular?: boolean;
  cta?: string;
};

export default function PlansGrid({
  id,
  eyebrow,
  title,
  desc,
  plans,
  cols = 4,
}: {
  id: string;
  eyebrow: string;
  title: string;
  desc?: string;
  plans: Plan[];
  cols?: 3 | 4;
}) {
  const grid = cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  return (
    <Section id={id}>
      <SectionHeader eyebrow={eyebrow} title={title} desc={desc} />
      <div className={`grid md:grid-cols-2 ${grid} gap-6`}>
        {plans.map((p, i) => (
          <PlanCard key={p.name} p={p} i={i} />
        ))}
      </div>
    </Section>
  );
}

function PlanCard({ p, i }: { p: Plan; i: number }) {
  const displayPrice = usePrice(p.price);
  return (
    <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.07 }}
            className={`relative rounded-2xl bg-card p-6 border transition-all hover:-translate-y-2 ${
              p.popular ? "border-primary/50 shadow-glow" : "border-border shadow-card hover:shadow-glow-soft"
            }`}
          >
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow">
                RECOMENDADO
              </div>
            )}
            <div
              className={`h-12 w-12 rounded-xl grid place-items-center mb-4 ${
                p.popular ? "bg-gradient-primary shadow-glow" : "bg-primary/10"
              }`}
            >
              <p.icon className={`h-6 w-6 ${p.popular ? "text-primary-foreground" : "text-primary"}`} />
            </div>
            {p.tag && (
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{p.tag}</div>
            )}
            <h3 className="text-xl font-bold mb-3">{p.name}</h3>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-4xl font-bold text-gradient-primary">{displayPrice}</span>
              {p.per && <span className="text-sm text-muted-foreground">{p.per}</span>}
            </div>
            <ul className="space-y-2.5 mb-6">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground/85">{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className={`group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold transition ${
                p.popular
                  ? "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02]"
                  : "border border-border hover:bg-primary/10 hover:border-primary/40"
              }`}
            >
              {p.cta || "Contratar"} <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
            </a>
          </motion.div>
  );
}
