import { Video, Film, Camera, Clapperboard } from "lucide-react";
import PlansGrid from "./PlansGrid";
import audiovisualBg from "@/assets/design-bg.jpg";

export default function AudiovisualPlans() {
  return (
    <section
      className="relative overflow-hidden bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: `url(${audiovisualBg})` }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,12,24,0.72) 0%, rgba(8,12,24,0.62) 40%, rgba(8,12,24,0.78) 100%)",
          backdropFilter: "blur(1px)",
        }}
      />
      <div className="relative z-10">
        <PlansGrid
          id="audiovisual"
          eyebrow="Audiovisual Premium"
          title="Produção audiovisual premium para marcas fortes"
          desc="Equipamentos profissionais, direção criativa e qualidade cinematográfica."
          plans={[
            {
              icon: Video, name: "Reels Profissional", price: "R$ 250", tag: "Conteúdo",
              features: ["Captação", "Edição premium", "Legendas dinâmicas", "Trilha sonora"],
            },
            {
              icon: Film, name: "Vídeo Institucional", price: "R$ 1.500", tag: "Mais escolhido", popular: true,
              features: ["Roteiro estratégico", "Captação profissional", "Edição premium", "Color grading"],
            },
            {
              icon: Camera, name: "Cobertura de Evento", price: "R$ 2.500", tag: "Eventos",
              features: ["Filmagem multi-câmera", "Fotografia profissional", "Highlights", "Entrega rápida"],
            },
            {
              icon: Clapperboard, name: "Produção Premium", price: "Sob consulta", tag: "Cinema",
              features: ["Comercial", "Podcast", "Documentário", "Campanha audiovisual completa"],
              cta: "Solicitar orçamento",
            },
          ]}
        />
      </div>
    </section>
  );
}
