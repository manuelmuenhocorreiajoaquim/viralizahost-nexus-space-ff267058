import { Image as ImageIcon, Layers, Palette, Building2 } from "lucide-react";
import PlansGrid from "./PlansGrid";
import designBg from "@/assets/design-bg.jpg";

export default function DesignPlans() {
  return (
    <div className="relative isolate">
      <img
        src={designBg}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={1920}
        height={1280}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        style={{ opacity: 0.38, filter: "contrast(1.1) brightness(0.9)" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: "rgba(255,255,255,0.55)", backdropFilter: "blur(1px)" }}
      />
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
    </div>
  );
}
