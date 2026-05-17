import { motion } from "framer-motion";
import { Cpu, HardDrive, Wifi, Check, Zap, ShieldCheck, Clock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Section, SectionHeader } from "./Section";
import { usePrice } from "@/lib/currency";

const tiers = [
  { name: "VPS NVMe 1", productId: "vps-1", cpu: "1 vCPU", ram: "4 GB", ssd: "50 GB NVMe", bw: "4 TB", price: "59.99", badge: null as string | null },
  { name: "VPS NVMe 2", productId: "vps-2", cpu: "2 vCPU", ram: "8 GB", ssd: "100 GB NVMe", bw: "8 TB", price: "87.99", badge: "Recomendado" },
  { name: "VPS NVMe 3", productId: "vps-3", cpu: "4 vCPU", ram: "16 GB", ssd: "200 GB NVMe", bw: "16 TB", price: "119.99", badge: "Mais popular" },
  { name: "VPS NVMe 4", productId: "vps-4", cpu: "8 vCPU", ram: "32 GB", ssd: "400 GB NVMe", bw: "32 TB", price: "239.99", badge: null },
];

export default function VPSSection() {
  return (
    <Section id="vps" className="relative">
      <SectionHeader
        eyebrow="VPS & Cloud"
        title="Performance bruta com NVMe"
        desc="KVM virtualizado, IPv4 dedicado, snapshots ilimitados e painel premium."
      />

      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
          <ShieldCheck className="h-3.5 w-3.5" /> Infraestrutura Oficial Hostinger
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
          <Clock className="h-3.5 w-3.5" /> Provisionamento automático em até 5 minutos
        </span>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {tiers.map((t, i) => (
          <Tier key={t.name} t={t} i={i} />
        ))}
      </div>
    </Section>
  );
}

function Tier({ t, i }: { t: typeof tiers[number]; i: number }) {
  const displayPrice = usePrice(t.price);
  return (
          <motion.div
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
              <span className="text-4xl font-bold text-gradient-primary">{displayPrice}</span>
              <span className="text-xs text-muted-foreground">/mês</span>
            </div>
            <Link
              to="/checkout"
              search={{ step: "cycle" as const, product: t.productId }}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:scale-[1.02] transition"
            >
              <Check className="h-4 w-4" /> Contratar
            </Link>
          </motion.div>
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
