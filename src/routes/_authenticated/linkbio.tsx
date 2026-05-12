import { createFileRoute } from "@tanstack/react-router";
import { Link2 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
export const Route = createFileRoute("/_authenticated/linkbio")({ component: () => (
  <div className="max-w-6xl mx-auto">
    <PageHeader title="Link na Bio" subtitle="A tua mini-página personalizada." />
    <EmptyState icon={Link2} title="Em breve" description="Cria a tua página Link na Bio premium em segundos." />
  </div>
)});
