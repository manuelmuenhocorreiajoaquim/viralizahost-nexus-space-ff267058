import { motion } from "framer-motion";
import { Mail, Cloud, Bot, Palette, Film, TrendingUp, Megaphone, Shield, Cpu, Globe, Zap, Code2 } from "lucide-react";
import { Section, SectionHeader } from "./Section";

const services = [
  { icon: Cloud, title: "VPS & Cloud NVMe", desc: "Servidores escaláveis com KVM, snapshots e isolamento total.", tag: "Infra" },
  { icon: Mail, title: "Email Corporativo", desc: "Caixas seguras com calendário, IA e app móvel.", tag: "Comunicação" },
  { icon: Bot, title: "IA & Agentes", desc: "Chatbots, automações n8n e agentes autónomos para o seu negócio.", tag: "IA" },
  { icon: Palette, title: "Design & Branding", desc: "Identidade visual, UI/UX e materiais que vendem.", tag: "Criativo" },
  { icon: Film, title: "Audiovisual Premium", desc: "Vídeos institucionais, reels e comerciais cinematográficos.", tag: "Vídeo" },
  { icon: TrendingUp, title: "Crescimento Social", desc: "Estratégias para Instagram, TikTok, YouTube e LinkedIn.", tag: "Social" },
  { icon: Megaphone, title: "Tráfego Pago", desc: "Meta Ads, Google Ads e funis com ROI mensurável.", tag: "Marketing" },
  { icon: Code2, title: "Desenvolvimento Web", desc: "Sites, e-commerces e SaaS feitos com tecnologia moderna.", tag: "Dev" },
  { icon: Shield, title: "Segurança Web", desc: "WAF, anti-DDoS, monitoramento e backups automáticos.", tag: "Security" },
  { icon: Cpu, title: "Automação Empresarial", desc: "Integre sistemas e elimine tarefas repetitivas.", tag: "Ops" },
  { icon: Globe, title: "Domínios Globais", desc: "Registo, transferência e gestão DNS premium.", tag: "Domains" },
  { icon: Zap, title: "Performance & CDN", desc: "Cloudflare Enterprise, cache inteligente e otimização.", tag: "Speed" },
];

export default function ServiceGrid() {
  return (
    <Section id="servicos">
      <SectionHeader
        eyebrow="Ecossistema completo"
        title="Tudo o que sua empresa precisa"
        desc="De hospedagem a marketing, IA, design e audiovisual — uma plataforma única e premium."
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="group relative rounded-2xl glass p-6 hover:shadow-glow-soft transition-all hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/30 transition" />
            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shadow-glow shrink-0">
                <s.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">{s.tag}</div>
                <h3 className="font-bold text-lg mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
