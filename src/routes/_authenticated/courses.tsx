import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap, BookOpen, Award, PlayCircle } from "lucide-react";
import { CategoryBanner, FeatureCard } from "@/components/dashboard/CategoryBanner";
import { CourseShowcase } from "@/components/dashboard/CourseShowcase";
export const Route = createFileRoute("/_authenticated/courses")({
  component: () => (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="courses"
        icon={GraduationCap}
        eyebrow="Formação"
        title="Cursos ViralizaHost"
        description="Marketing digital, IA, design, hospedagem — formação prática e certificada."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon={BookOpen} tone="violet" title="Trilhas completas" description="Do iniciante ao avançado em cada área." />
        <FeatureCard icon={PlayCircle} tone="rose" title="Aulas em vídeo" description="Conteúdo HD com exemplos práticos." />
        <FeatureCard icon={Award} tone="amber" title="Certificados" description="Recebe certificado após concluir cada curso." />
      </div>

      <CourseShowcase />
    </div>
  ),
});
