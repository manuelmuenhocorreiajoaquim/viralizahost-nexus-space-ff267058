import { Image as ImageIcon, Layers, Palette, Building2 } from "lucide-react";
import PlansGrid from "./PlansGrid";

export default function DesignPlans() {
  return (
    <PlansGrid
      id="design"
      eyebrow="Design & Branding"
      title="Design profissional para marcas que querem crescer"
      desc="Identidade visual e peças que comunicam autoridade e geram conversão."
      plans={[
        {
          icon: ImageIcon, name: "Flyer Digital", price: "R$ 80", tag: "Avulso",
          features: ["Arte profissional", "Formato redes sociais", "Entrega rápida", "1 revisão incluída"],
        },
        {
          icon: Layers, name: "Social Media Kit", price: "R$ 350", tag: "Pacote",
          features: ["10 artes premium", "Identidade visual", "Templates editáveis", "Stories & feed"],
        },
        {
          icon: Palette, name: "Branding Premium", price: "R$ 1.500", tag: "Mais escolhido", popular: true,
          features: ["Logotipo profissional", "Paleta de cores", "Manual básico da marca", "Aplicações visuais"],
        },
        {
          icon: Building2, name: "Identidade Completa", price: "Sob consulta", tag: "Enterprise",
          features: ["Branding completo", "Papelaria corporativa", "Apresentação institucional", "Kit redes sociais"],
          cta: "Falar com designer",
        },
      ]}
    />
  );
}
