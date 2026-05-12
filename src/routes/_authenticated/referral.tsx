import { createFileRoute } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
export const Route = createFileRoute("/_authenticated/referral")({ component: () => (
  <div className="max-w-6xl mx-auto">
    <PageHeader title="Indique e Ganhe" subtitle="Convida amigos e ganha créditos." />
    <EmptyState icon={Gift} title="Em breve" description="Partilha o teu código de indicação e ganha créditos na ViralizaHost." />
  </div>
)});
