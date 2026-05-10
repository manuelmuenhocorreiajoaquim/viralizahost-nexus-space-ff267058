import { motion } from "framer-motion";
import { Cpu, HardDrive, Wifi, Check, Zap } from "lucide-react";
import { Section, SectionHeader } from "./Section";

const tiers = [
  { name: "VPS NVMe 2", cpu: "2 vCPU", ram: "4 GB", ssd: "80 GB", bw: "4 TB", price: "89", badge: null },
  { name: "VPS NVMe 4", cpu: "4 vCPU", ram: "8 GB", ssd: "160 GB", bw: "6 TB", price: "189", badge: "Recomendado" },
  { name: "VPS NVMe 8", cpu: "8 vCPU", ram: "16 GB", ssd: "320 GB", bw: "10 TB", price: "349", badge: "Mais popular" },
  { name: "Dedicado Pro", cpu: "16 vCPU", ram: "64 GB", ssd: "1 TB", bw: "20 TB", price: "899", badge: null },
];

export default function VPSSection() {
  return (
    <Section id="vps" className="relative">
      <SectionHeader
        eyebrow="VPS & Cloud"
        title="Performance bruta com NVMe"
        desc="KVM virtualizado, IPv4 dedicado, snapshots ilimitados e painel premium."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {tiers.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="relative rounded-2xl glass p-6 hover:shadow-glow-soft transition-all hover:-translate-y-1"
          >
            {t.badge && (
              <div className="absolute -top-3 right-4 px-2.5 py-1 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-bold tracking-wide shadow-glow">
                {t.badge.toUpperCase()}
              </div>
            )}
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-bold">{t.name}</h3>
            </div>
            <div className="space-y-2 text-sm mb-5">
              <Row icon={Cpu} label="CPU" value={t.cpu} />
              <Row icon={HardDrive} label="RAM" value={t.ram} />
              <Row icon={HardDrive} label="NVMe" value={t.ssd} />
              <Row icon={Wifi} label="Banda" value={t.bw} />
            </div>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-xs text-muted-foreground">R$</span>
              <span className="text-4xl font-bold text-gradient-primary">{t.price}</span>
              <span className="text-xs text-muted-foreground">/mês</span>
            </div>
            <a href="#" className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:scale-[1.02] transition">
              <Check className="h-4 w-4" /> Contratar
            </a>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
