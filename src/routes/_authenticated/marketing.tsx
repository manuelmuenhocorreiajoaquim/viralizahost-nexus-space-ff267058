import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, TrendingUp, Target, BarChart3, Users, Search } from "lucide-react";
import { CategoryBanner, FeatureCard } from "@/components/dashboard/CategoryBanner";
export const Route = createFileRoute("/_authenticated/marketing")({
  component: () => (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="marketing"
        icon={Megaphone}
        eyebrow="Crescimento"
        title="Marketing Digital"
        description="Tráfego pago, SEO, redes sociais e funis de vendas — tudo gerido num só painel."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon={Target} tone="rose" title="Meta Ads" description="Campanhas no Facebook e Instagram com performance real." />
        <FeatureCard icon={Search} tone="amber" title="Google Ads" description="Anúncios na rede de pesquisa, display e YouTube." />
        <FeatureCard icon={TrendingUp} tone="emerald" title="SEO" description="Optimização orgânica e ranking nos motores de busca." />
        <FeatureCard icon={BarChart3} tone="blue" title="Analytics" description="Relatórios detalhados de conversão e ROI." />
        <FeatureCard icon={Users} tone="violet" title="Funis" description="Capta leads, nutre e converte em clientes." />
        <FeatureCard icon={Megaphone} tone="indigo" title="Social Media" description="Gestão de conteúdo, calendário editorial e engajamento." />
      </div>
    </div>
  ),
});
