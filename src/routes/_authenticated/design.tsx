import { createFileRoute } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
export const Route = createFileRoute("/_authenticated/design")({ component: () => (
  <div className="max-w-6xl mx-auto">
    <PageHeader title="Design Gráfico" subtitle="Identidade visual e materiais." />
    <EmptyState icon={Palette} title="Em breve" description="Solicita logos, banners, social kits e branding completo." />
  </div>
)});
