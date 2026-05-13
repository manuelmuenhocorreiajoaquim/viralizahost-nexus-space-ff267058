import { createFileRoute } from "@tanstack/react-router";
import { Bot, MessageSquare, Workflow, Brain, Zap, Sparkles } from "lucide-react";
import { CategoryBanner, FeatureCard } from "@/components/dashboard/CategoryBanner";
export const Route = createFileRoute("/_authenticated/ai")({
  component: () => (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="ai"
        icon={Bot}
        eyebrow="Inteligência artificial"
        title="IA & Automação"
        description="Agentes IA, chatbots, workflows e automações empresariais que escalam o teu negócio."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <FeatureCard icon={MessageSquare} tone="cyan" title="Chatbots" description="Atendimento 24/7 no WhatsApp, site e redes sociais." />
        <FeatureCard icon={Brain} tone="violet" title="Agentes IA" description="Assistentes treinados com a tua base de conhecimento." />
        <FeatureCard icon={Workflow} tone="indigo" title="Workflows" description="Automatiza processos repetitivos com n8n / Make." />
        <FeatureCard icon={Sparkles} tone="rose" title="Geração de conteúdo" description="Textos, imagens e vídeos com IA generativa." />
        <FeatureCard icon={Zap} tone="amber" title="Integrações" description="Conecta CRM, e-mail, ERP e mais de 1000 apps." />
        <FeatureCard icon={Bot} tone="blue" title="Voice AI" description="Atendimento por voz com IA conversacional." />
      </div>
    </div>
  ),
});
