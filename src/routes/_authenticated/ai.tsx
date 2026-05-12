import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
export const Route = createFileRoute("/_authenticated/ai")({ component: () => (
  <div className="max-w-6xl mx-auto">
    <PageHeader title="IA & Automação" subtitle="Agentes, chatbots e workflows." />
    <EmptyState icon={Bot} title="Em breve" description="Cria e treina os teus agentes IA, chatbots e automações empresariais." />
  </div>
)});
