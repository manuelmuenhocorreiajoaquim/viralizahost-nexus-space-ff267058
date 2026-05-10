import { motion } from "framer-motion";
import { Search, Globe } from "lucide-react";
import { Section, SectionHeader } from "./Section";
import { formatPrice, useCurrency } from "@/lib/currency";

const domains = [
  { ext: ".com", price: "R$ 59", per: "/ano", popular: true },
  { ext: ".com.br", price: "R$ 49", per: "/ano" },
  { ext: ".ao", price: "R$ 250", per: "/ano" },
  { ext: ".co.ao", price: "R$ 350", per: "/ano" },
  { ext: ".net", price: "R$ 69", per: "/ano" },
  { ext: ".org", price: "R$ 69", per: "/ano" },
];

export default function DomainsSection() {
  const { currency } = useCurrency();
  return (
    <Section id="dominios" className="bg-background">
      <SectionHeader
        eyebrow="Domínios"
        title="Encontre o domínio perfeito para a sua marca"
        desc="Pesquise, registre e proteja a identidade digital do seu negócio em segundos."
      />

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        onSubmit={(e) => e.preventDefault()}
        className="max-w-3xl mx-auto mb-14"
      >
        <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-card shadow-elegant border border-border">
          <div className="flex items-center gap-3 flex-1 px-4">
            <Globe className="h-5 w-5 text-primary shrink-0" />
            <input
              type="text"
              placeholder="pesquiseoseudominio.com"
              className="flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-[1.02] transition">
            <Search className="h-4 w-4" /> Pesquisar Domínio
          </button>
        </div>
      </motion.form>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {domains.map((d, i) => (
          <motion.div
            key={d.ext}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className={`relative rounded-2xl bg-card p-5 text-center border transition-all hover:-translate-y-1 hover:shadow-glow-soft ${
              d.popular ? "border-primary/40 shadow-glow-soft" : "border-border"
            }`}
          >
            {d.popular && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-bold">
                MAIS POPULAR
              </div>
            )}
            <div className="text-2xl font-display font-bold text-gradient-primary">{d.ext}</div>
            <div className="mt-2 text-sm">
              <span className="font-bold text-foreground">{formatPrice(d.price, currency)}</span>
              <span className="text-muted-foreground">{d.per}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
