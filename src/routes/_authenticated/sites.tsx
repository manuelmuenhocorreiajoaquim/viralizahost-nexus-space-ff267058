import { createFileRoute } from "@tanstack/react-router";
import { Globe, Sparkles, Layout, Boxes, Rocket, Code2 } from "lucide-react";
import { CategoryBanner, FeatureCard } from "@/components/dashboard/CategoryBanner";
export const Route = createFileRoute("/_authenticated/sites")({
  component: () => (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="sites"
        icon={Globe}
        eyebrow="Web"
        title="Sites & Landing Pages"
        description="Cria, instala e gere WordPress, construtores visuais e landing pages de alta performance."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon={Sparkles} tone="violet" title="WordPress 1-clique" description="Instala WordPress optimizado em segundos." />
        <FeatureCard icon={Layout} tone="blue" title="Construtor visual" description="Edita o teu site sem código com drag & drop." />
        <FeatureCard icon={Boxes} tone="indigo" title="Templates" description="Centenas de modelos para qualquer nicho." />
        <FeatureCard icon={Rocket} tone="rose" title="Landing pages" description="Páginas de conversão optimizadas para campanhas." />
        <FeatureCard icon={Code2} tone="emerald" title="Custom code" description="Acesso total ao código via cPanel/SSH." />
        <FeatureCard icon={Globe} tone="cyan" title="CDN global" description="Conteúdo entregue em mais de 200 cidades." />
      </div>
    </div>
  ),
});
