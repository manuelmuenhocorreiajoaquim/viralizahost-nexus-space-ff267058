import { createFileRoute } from "@tanstack/react-router";
import { Gift, Share2, Coins, Users } from "lucide-react";
import { CategoryBanner, FeatureCard } from "@/components/dashboard/CategoryBanner";
export const Route = createFileRoute("/_authenticated/referral")({
  component: () => (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="referral"
        icon={Gift}
        eyebrow="Programa"
        title="Indique e Ganhe"
        description="Convida amigos e ganha créditos na ViralizaHost por cada indicação convertida."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon={Share2} tone="emerald" title="Partilha o teu código" description="Cada indicação gera créditos para ti." />
        <FeatureCard icon={Coins} tone="amber" title="Acumula créditos" description="Usa em qualquer plano ou serviço." />
        <FeatureCard icon={Users} tone="blue" title="Acompanha indicações" description="Vê quem se registou e converteu." />
      </div>
    </div>
  ),
});
