import { createFileRoute } from "@tanstack/react-router";
import { Video } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
export const Route = createFileRoute("/_authenticated/audiovisual")({ component: () => (
  <div className="max-w-6xl mx-auto">
    <PageHeader title="Audiovisual" subtitle="Vídeos, motion e produção." />
    <EmptyState icon={Video} title="Em breve" description="Gere os teus projectos de vídeo, motion graphics e produção audiovisual." />
  </div>
)});
