import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Zap, Cpu, HardDrive, Wifi, Check, ArrowRight, Globe, ShieldCheck, Clock } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { usePrice } from "@/lib/currency";
import { startCheckout } from "@/lib/cart";

export const Route = createFileRoute("/vps-cloud/vps-nvme")({
  head: () => ({
    meta: [
      { title: "VPS NVMe — ViralizaHost" },
      { name: "description", content: "VPS KVM em infraestrutura oficial Hostinger. Provisionamento automático em até 5 minutos." },
      { property: "og:title", content: "VPS NVMe — ViralizaHost" },
      { property: "og:description", content: "Servidores virtuais KVM com NVMe, IPv4 dedicado e provisionamento automático." },
    ],
  }),
  component: VPSNvmePage,
});

const tiers = [
  { name: "VPS NVMe 1", productId: "vps-1", cpu: "1 vCPU", ram: "4 GB", ssd: "50 GB NVMe", bw: "4 TB", price: "59.99" },
  { name: "VPS NVMe 2", productId: "vps-2", cpu: "2 vCPU", ram: "8 GB", ssd: "100 GB NVMe", bw: "8 TB", price: "87.99", popular: true },
  { name: "VPS NVMe 3", productId: "vps-3", cpu: "4 vCPU", ram: "16 GB", ssd: "200 GB NVMe", bw: "16 TB", price: "119.99" },
  { name: "VPS NVMe 4", productId: "vps-4", cpu: "8 vCPU", ram: "32 GB", ssd: "400 GB NVMe", bw: "32 TB", price: "239.99" },
];

function VPSNvmePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Zap className="h-3.5 w-3.5" /> VPS NVMe
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Performance bruta com <span className="text-gradient-primary">NVMe</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              KVM virtualizado, IPv4 dedicado, snapshots ilimitados e painel premium. Domínio é opcional.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                <ShieldCheck className="h-3.5 w-3.5" /> Infraestrutura Oficial Hostinger
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                <Clock className="h-3.5 w-3.5" /> Provisionamento automático em até 5 minutos
              </span>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((t, i) => <Tier key={t.name} t={t} i={i} />)}
          </div>

          <div className="mt-14 rounded-2xl bg-card border border-border p-6 flex flex-col md:flex-row items-center gap-4">
            <Globe className="h-6 w-6 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground flex-1 text-center md:text-left">
              Domínio é opcional. Você pode registrar um novo, usar o seu atual ou continuar sem domínio agora.
            </p>
            <Link to="/dominios/registrar" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-primary/10 text-sm font-semibold transition">
              Pesquisar domínio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <CTAFooter />
    </div>
  );
}

function Tier({ t, i }: { t: typeof tiers[number]; i: number }) {
  const displayPrice = usePrice(t.price);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: i * 0.07 }}
      className={`relative rounded-2xl bg-card p-6 border transition-all hover:-translate-y-2 ${t.popular ? "border-primary/50 shadow-glow" : "border-border shadow-card hover:shadow-glow-soft"}`}
    >
      {t.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold shadow-glow">
          MAIS POPULAR
        </div>
      )}
      <div className={`h-12 w-12 rounded-xl grid place-items-center mb-4 ${t.popular ? "bg-gradient-primary shadow-glow" : "bg-primary/10"}`}>
        <Zap className={`h-6 w-6 ${t.popular ? "text-primary-foreground" : "text-primary"}`} />
      </div>
      <h3 className="text-xl font-bold mb-3">{t.name}</h3>
      <div className="space-y-2 text-sm mb-5">
        <Row icon={Cpu} label="CPU" value={t.cpu} />
        <Row icon={HardDrive} label="RAM" value={t.ram} />
        <Row icon={HardDrive} label="NVMe" value={t.ssd} />
        <Row icon={Wifi} label="Banda" value={t.bw} />
      </div>
      <div className="flex items-baseline gap-1 mb-5">
        <span className="text-4xl font-bold text-gradient-primary">{displayPrice}</span>
        <span className="text-sm text-muted-foreground">/mês</span>
      </div>
      <Link
        to="/checkout"
        search={{ step: "cycle" as const, product: t.productId }}
        className={`group flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-semibold transition ${t.popular ? "bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02]" : "border border-border hover:bg-primary/10 hover:border-primary/40"}`}
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
