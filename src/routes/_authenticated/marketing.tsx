import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
export const Route = createFileRoute("/_authenticated/marketing")({ component: () => (
  <div className="max-w-6xl mx-auto">
    <PageHeader title="Marketing" subtitle="Tráfego pago, SEO e funis." />
    <EmptyState icon={Megaphone} title="Em breve" description="Acompanha as tuas campanhas Meta Ads, Google Ads e relatórios de performance." />
  </div>
)});
