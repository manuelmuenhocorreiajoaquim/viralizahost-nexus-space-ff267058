import { Image as ImageIcon, Layers, Palette, Building2 } from "lucide-react";
import PlansGrid from "./PlansGrid";
import { useCmsPlans } from "@/lib/use-cms-plans";

const fallback = [
  {
    icon: ImageIcon, name: "Flyer Digital", price: "R$ 80", tag: "Avulso", productId: "design-flyer",
    features: ["Arte profissional", "Formato redes sociais", "Entrega rápida", "1 revisão incluída"],
  },
  {
    icon: Layers, name: "Social Media Kit", price: "R$ 350", tag: "Pacote", productId: "design-social-kit",
    features: ["10 artes premium", "Identidade visual", "Templates editáveis", "Stories & feed"],
  },
  {
    icon: Palette, name: "Branding Premium", price: "R$ 1.500", tag: "Mais escolhido", popular: true, productId: "design-branding-premium",
    features: ["Logotipo profissional", "Paleta de cores", "Manual básico da marca", "Aplicações visuais"],
  },
  {
    icon: Building2, name: "Identidade Completa", price: "Sob consulta", tag: "Enterprise",
    features: ["Branding completo", "Papelaria corporativa", "Apresentação institucional", "Kit redes sociais"],
    cta: "Falar com designer",
  },
];

export default function DesignPlans() {
  const plans = useCmsPlans("design", fallback);
  return (
    <PlansGrid
      id="design"
      eyebrow="Design & Branding"
      title="Design profissional para marcas que querem crescer"
      desc="Identidade visual e peças que comunicam autoridade e geram conversão."
      plans={plans}
    />
  );
}
