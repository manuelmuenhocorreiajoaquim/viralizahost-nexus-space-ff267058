import { motion } from "framer-motion";
import { Bot, Workflow, MessageCircle, Brain, Zap, Network, ArrowRight } from "lucide-react";
import { Section, SectionHeader } from "./Section";
import aiImg from "@/assets/hero-ai.jpg";

const items = [
  { icon: Bot, title: "Chatbots IA", desc: "Atendimento 24/7 com modelos GPT e Claude integrados." },
  { icon: Workflow, title: "Automação n8n", desc: "Workflows ilimitados conectando 400+ aplicações." },
  { icon: MessageCircle, title: "IA WhatsApp", desc: "Vendas, suporte e qualificação via WhatsApp Business." },
  { icon: Brain, title: "Agentes Autónomos", desc: "Agentes que executam tarefas complexas sem supervisão." },
  { icon: Zap, title: "IA Empresarial", desc: "Modelos privados treinados nos dados da sua empresa." },
  { icon: Network, title: "Integrações API", desc: "Conecte CRMs, ERPs e plataformas internas." },
];

export default function AISection() {
  return (
    <Section id="ia" className="relative overflow-hidden">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-royal/20 blur-[140px]" />

      <div className="grid lg:grid-cols-2 gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute -inset-6 bg-gradient-primary opacity-25 blur-3xl rounded-full" />
          <div className="relative rounded-3xl overflow-hidden glass shadow-elegant">
            <img src={aiImg} loading="lazy" width={1536} height={1024} alt="IA" className="w-full" />
          </div>
        </motion.div>

        <div>
          <SectionHeader
            eyebrow="IA & Automação"
            title="Inteligência que trabalha por si"
            desc="Implementamos IA real no seu negócio: chatbots, agentes, automações e integrações."
          />
          <div className="grid sm:grid-cols-2 gap-4">
            {items.map((it, i) => (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="rounded-xl glass p-4 hover:shadow-glow-soft transition"
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-primary grid place-items-center shadow-glow mb-3">
                  <it.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h4 className="font-bold mb-1">{it.title}</h4>
                <p className="text-xs text-muted-foreground">{it.desc}</p>
              </motion.div>
            ))}
          </div>
          <a href="#" className="group inline-flex mt-8 items-center gap-2 px-6 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 transition">
            Falar com a nossa IA <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
          </a>
        </div>
      </div>
    </Section>
  );
}
