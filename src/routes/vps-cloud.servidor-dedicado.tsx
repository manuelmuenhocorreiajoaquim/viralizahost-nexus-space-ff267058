import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Server, Cpu, HardDrive, Wifi, Check, ArrowRight, Globe, Shield } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { usePrice } from "@/lib/currency";

export const Route = createFileRoute("/vps-cloud/servidor-dedicado")({
  head: () => ({
    meta: [
      { title: "Servidor Dedicado — ViralizaHost" },
      { name: "description", content: "Servidores dedicados bare metal com hardware exclusivo, alta performance e total controle. Domínio opcional." },
      { property: "og:title", content: "Servidor Dedicado — ViralizaHost" },
      { property: "og:description", content: "Bare metal com recursos exclusivos para máxima performance." },
    ],
  }),
  component: DedicadoPage,
});

const tiers = [
  { name: "Dedicado Start", productId: "dedicado-start", cpu: "Xeon 8 cores", ram: "32 GB", ssd: "1 TB NVMe", bw: "20 TB", price: "690" },
  { name: "Dedicado Pro", productId: "dedicado-pro", cpu: "Xeon 16 cores", ram: "64 GB", ssd: "2 TB NVMe", bw: "30 TB", price: "1290", popular: true },
  { name: "Dedicado Enterprise", productId: "dedicado-enterprise", cpu: "Xeon 32 cores", ram: "128 GB", ssd: "4 TB NVMe", bw: "50 TB", price: "2490" },
];

function DedicadoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Server className="h-3.5 w-3.5" /> Servidor Dedicado
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Bare metal com <span className="text-gradient-primary">hardware exclusivo</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Servidores dedicados de alto desempenho com recursos 100% seus. Total controle, performance máxima.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((t, i) => <Tier key={t.name} t={t} i={i} />)}
          </div>

          <div className="mt-14 grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-card border border-border p-6 flex items-center gap-4">
              <Shield className="h-6 w-6 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                IPMI/KVM, monitoramento 24/7, hardware redundante e SLA premium.
              </p>
            </div>
            <div className="rounded-2xl bg-card border border-border p-6 flex items-center gap-4">
              <Globe className="h-6 w-6 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground flex-1">
                Domínio é opcional — pode adicionar no checkout.
              </p>
              <Link to="/dominios/registrar" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-primary/10 text-xs font-semibold transition">
                Pesquisar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
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
          RECOMENDADO
        </div>
      )}
      <div className={`h-12 w-12 rounded-xl grid place-items-center mb-4 ${t.popular ? "bg-gradient-primary shadow-glow" : "bg-primary/10"}`}>
        <Server className={`h-6 w-6 ${t.popular ? "text-primary-foreground" : "text-primary"}`} />
      </div>
      <h3 className="text-xl font-bold mb-3">{t.name}</h3>
      <div className="space-y-2 text-sm mb-5">
        <Row icon={Cpu} label="CPU" value={t.cpu} />
        <Row icon={HardDrive} label="RAM" value={t.ram} />
        <Row icon={HardDrive} label="Disco" value={t.ssd} />
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
