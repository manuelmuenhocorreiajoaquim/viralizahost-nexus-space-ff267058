import { createFileRoute } from "@tanstack/react-router";
import { Palette, Image, Layers, Brush, Sparkles, Type } from "lucide-react";
import { CategoryBanner, FeatureCard } from "@/components/dashboard/CategoryBanner";
export const Route = createFileRoute("/_authenticated/design")({
  component: () => (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="design"
        icon={Palette}
        eyebrow="Identidade visual"
        title="Design Gráfico"
        description="Logos, banners, social kits e branding completo — feito por designers profissionais."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon={Sparkles} tone="violet" title="Logo & Branding" description="Identidade completa com manual de marca." />
        <FeatureCard icon={Image} tone="rose" title="Banners & Posts" description="Materiais para Instagram, Facebook e LinkedIn." />
        <FeatureCard icon={Layers} tone="indigo" title="Social Kit" description="Pacote mensal de artes para redes sociais." />
        <FeatureCard icon={Brush} tone="amber" title="Ilustrações" description="Ilustrações personalizadas para o teu negócio." />
        <FeatureCard icon={Type} tone="cyan" title="Tipografia" description="Fontes e hierarquia visual à medida." />
        <FeatureCard icon={Palette} tone="blue" title="Material impresso" description="Cartões, flyers, embalagens e mais." />
      </div>
    </div>
  ),
});
