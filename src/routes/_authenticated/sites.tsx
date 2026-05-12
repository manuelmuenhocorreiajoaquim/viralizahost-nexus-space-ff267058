import { createFileRoute } from "@tanstack/react-router";
import { Globe } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
export const Route = createFileRoute("/_authenticated/sites")({ component: () => (
  <div className="max-w-6xl mx-auto">
    <PageHeader title="Sites" subtitle="Os teus sites e instalações." />
    <EmptyState icon={Globe} title="Em breve" description="Aqui poderás criar e gerir sites WordPress, instaladores e construtores visuais." />
  </div>
)});
