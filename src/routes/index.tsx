import { createFileRoute } from "@tanstack/react-router";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import DomainsSection from "@/components/site/DomainsSection";
import EmailPlans from "@/components/site/EmailPlans";
import HostingPlans from "@/components/site/HostingPlans";
import TeamSection from "@/components/site/TeamSection";
import AIPlans from "@/components/site/AIPlans";
import PromoSliders from "@/components/site/PromoSliders";
import TrafficPlans from "@/components/site/TrafficPlans";
import DesignPlans from "@/components/site/DesignPlans";
import AudiovisualPlans from "@/components/site/AudiovisualPlans";
import ServiceGrid from "@/components/site/ServiceGrid";
import CTAFooter from "@/components/site/CTAFooter";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ViralizaHost — Hospedagem, IA, Marketing e Audiovisual Premium" },
      { name: "description", content: "Ecossistema digital premium: domínios, e-mail corporativo, hospedagem cloud, IA, tráfego pago, design e audiovisual." },
      { property: "og:title", content: "ViralizaHost — Hospedagem · Performance · Confiança" },
      { property: "og:description", content: "Domínios, hospedagem cloud, IA empresarial, tráfego pago, design e produção audiovisual premium." },
    ],
  }),
});

function Index() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <DomainsSection />
      <EmailPlans />
      <HostingPlans />
      <TeamSection />
      <AIPlans />
      <PromoSliders />
      <TrafficPlans />
      <DesignPlans />
      <AudiovisualPlans />
      <ServiceGrid />
      <CTAFooter />
    </main>
  );
}
