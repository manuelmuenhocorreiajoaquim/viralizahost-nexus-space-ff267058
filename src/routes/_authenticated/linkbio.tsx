import { createFileRoute } from "@tanstack/react-router";
import { Link2, Sparkles, Eye, BarChart3 } from "lucide-react";
import { CategoryBanner, FeatureCard } from "@/components/dashboard/CategoryBanner";
export const Route = createFileRoute("/_authenticated/linkbio")({
  component: () => (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="linkbio"
        icon={Link2}
        eyebrow="Mini-site"
        title="Link na Bio"
        description="Cria a tua mini-página premium com todos os teus links num só lugar."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon={Sparkles} tone="rose" title="Templates premium" description="Designs modernos e personalizáveis." />
        <FeatureCard icon={Eye} tone="violet" title="Pré-visualização ao vivo" description="Vê alterações em tempo real." />
        <FeatureCard icon={BarChart3} tone="indigo" title="Analytics" description="Métricas de cliques e visitantes." />
      </div>
    </div>
  ),
});
