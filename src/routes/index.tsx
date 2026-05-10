import { createFileRoute } from "@tanstack/react-router";
import Navbar from "@/components/site/Navbar";
import Hero from "@/components/site/Hero";
import HostingPlans from "@/components/site/HostingPlans";
import ServiceGrid from "@/components/site/ServiceGrid";
import VPSSection from "@/components/site/VPSSection";
import AISection from "@/components/site/AISection";
import GlobalSection from "@/components/site/GlobalSection";
import Testimonials from "@/components/site/Testimonials";
import CTAFooter from "@/components/site/CTAFooter";
import FloatingActions from "@/components/site/FloatingActions";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ViralizaHost — Hospedagem, IA, Marketing e Audiovisual Premium" },
      { name: "description", content: "Ecossistema digital premium: hospedagem cloud LiteSpeed, VPS NVMe, IA e automação, design, audiovisual e marketing digital." },
      { property: "og:title", content: "ViralizaHost — Hospedagem · Performance · Confiança" },
      { property: "og:description", content: "Infraestrutura cloud global, IA empresarial, marketing digital e produção audiovisual premium." },
    ],
  }),
});

function Index() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <HostingPlans />
      <ServiceGrid />
      <VPSSection />
      <AISection />
      <GlobalSection />
      <Testimonials />
      <CTAFooter />
      <FloatingActions />
    </main>
  );
}
