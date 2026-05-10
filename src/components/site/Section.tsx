import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function SectionHeader({ eyebrow, title, desc }: { eyebrow?: string; title: ReactNode; desc?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-3xl mx-auto mb-14"
    >
      {eyebrow && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-primary mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
        <span className="text-gradient">{title}</span>
      </h2>
      {desc && <p className="mt-4 text-lg text-muted-foreground">{desc}</p>}
    </motion.div>
  );
}

export function Section({ id, children, className = "" }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`relative py-24 ${className}`}>
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">{children}</div>
    </section>
  );
}
