import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
export const Route = createFileRoute("/_authenticated/courses")({ component: () => (
  <div className="max-w-6xl mx-auto">
    <PageHeader title="Cursos" subtitle="Formação digital ViralizaHost." />
    <EmptyState icon={GraduationCap} title="Em breve" description="Acede aos cursos de marketing digital, IA, design e hospedagem." />
  </div>
)});
