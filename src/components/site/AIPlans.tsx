import { Bot, Workflow, Brain, Building2 } from "lucide-react";
import PlansGrid from "./PlansGrid";

export default function AIPlans() {
  return (
    <PlansGrid
      id="ia-planos"
      eyebrow="IA & Automação"
      title="Soluções de IA para automatizar o seu negócio"
      desc="Chatbots, agentes autónomos, integrações e automações que escalam."
      plans={[
        {
          icon: Bot, name: "Chatbot IA Starter", price: "R$ 299", tag: "Entrada",
          features: ["Bot para WhatsApp", "Respostas automáticas", "Fluxo básico", "Integração simples"],
        },
        {
          icon: Workflow, name: "Automação Business", price: "R$ 799", tag: "Mais escolhido", popular: true,
          features: ["Workflows n8n", "WhatsApp + CRM", "Integrações API", "Relatórios", "Suporte prioritário"],
        },
        {
          icon: Brain, name: "Agente IA Premium", price: "R$ 1.499", tag: "Performance",
          features: ["Agente inteligente", "Atendimento 24h", "Integrações avançadas", "Dashboard exclusivo", "Suporte premium"],
        },
        {
          icon: Building2, name: "IA Enterprise", price: "Sob consulta", tag: "Corporativo",
          features: ["Soluções personalizadas", "Integração com sistemas internos", "Treinamento de dados", "Segurança avançada"],
          cta: "Falar com especialista",
        },
      ]}
    />
  );
}
