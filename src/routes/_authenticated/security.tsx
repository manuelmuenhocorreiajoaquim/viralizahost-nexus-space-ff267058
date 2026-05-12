import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
export const Route = createFileRoute("/_authenticated/security")({ component: () => (
  <div className="max-w-6xl mx-auto">
    <PageHeader title="Segurança & Backup" subtitle="Protecção e cópias de segurança." />
    <EmptyState icon={Shield} title="Em breve" description="SSL, backups automáticos, firewall e malware scan estarão disponíveis aqui." />
  </div>
)});
