import { createFileRoute } from "@tanstack/react-router";
import { Video, Film, Camera, Mic, Scissors, Tv } from "lucide-react";
import { CategoryBanner, FeatureCard } from "@/components/dashboard/CategoryBanner";
export const Route = createFileRoute("/_authenticated/meu-audiovisual")({
  component: () => (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="video"
        icon={Video}
        eyebrow="Produção"
        title="Audiovisual"
        description="Vídeos institucionais, motion graphics, edição e produção completa."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon={Film} tone="amber" title="Vídeos institucionais" description="Apresentações profissionais da tua empresa." />
        <FeatureCard icon={Camera} tone="rose" title="Filmagem" description="Captação 4K com equipamento profissional." />
        <FeatureCard icon={Scissors} tone="violet" title="Edição" description="Pós-produção, color grading e finalização." />
        <FeatureCard icon={Tv} tone="indigo" title="Motion Graphics" description="Animações 2D/3D para campanhas e redes sociais." />
        <FeatureCard icon={Mic} tone="emerald" title="Locução" description="Voz profissional em PT/EN para os teus vídeos." />
        <FeatureCard icon={Video} tone="blue" title="Reels & Shorts" description="Conteúdo vertical optimizado para mobile." />
      </div>
    </div>
  ),
});
