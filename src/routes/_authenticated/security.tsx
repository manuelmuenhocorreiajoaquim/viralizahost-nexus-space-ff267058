import { createFileRoute } from "@tanstack/react-router";
import { Shield, Lock, RefreshCw, Bug, KeyRound, FileCheck } from "lucide-react";
import { CategoryBanner, FeatureCard } from "@/components/dashboard/CategoryBanner";
export const Route = createFileRoute("/_authenticated/security")({
  component: () => (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="security"
        icon={Shield}
        eyebrow="Protecção"
        title="Segurança & Backup"
        description="SSL, backups automáticos, firewall e protecção contra malware para os teus serviços."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon={Lock} tone="emerald" title="SSL gratuito" description="Certificados Let's Encrypt activos em todos os teus domínios." />
        <FeatureCard icon={RefreshCw} tone="blue" title="Backups diários" description="Cópias automáticas com retenção de até 30 dias." />
        <FeatureCard icon={Bug} tone="rose" title="Anti-malware" description="Scans periódicos e quarentena automática de ameaças." />
        <FeatureCard icon={KeyRound} tone="violet" title="2FA" description="Activa autenticação de dois factores na tua conta." />
        <FeatureCard icon={FileCheck} tone="cyan" title="Audit logs" description="Histórico completo de acessos e alterações." />
        <FeatureCard icon={Shield} tone="indigo" title="Firewall" description="Protecção WAF integrada contra ataques DDoS." />
      </div>
    </div>
  ),
});
