import { Mail, Briefcase, Crown, Building2 } from "lucide-react";
import PlansGrid from "./PlansGrid";

export default function EmailPlans() {
  return (
    <PlansGrid
      id="emails"
      eyebrow="E-mails Corporativos"
      title="E-mail profissional para empresas modernas"
      desc="Caixas seguras, com IA, calendário e identidade da sua marca."
      plans={[
        {
          icon: Mail, name: "E-mail Starter", price: "R$ 29", per: "/mês", tag: "Essencial",
          productId: "email-starter",
          features: ["1 conta profissional", "10 GB armazenamento", "Webmail", "Antispam", "Suporte básico"],
        },
        {
          icon: Briefcase, name: "E-mail Business", price: "R$ 59", per: "/mês", tag: "Mais escolhido", popular: true,
          productId: "email-business",
          features: ["5 contas profissionais", "50 GB armazenamento", "Calendário", "Backup automático", "Suporte prioritário"],
        },
        {
          icon: Crown, name: "E-mail Premium", price: "R$ 99", per: "/mês", tag: "Performance",
          productId: "email-premium",
          features: ["10 contas profissionais", "100 GB armazenamento", "Segurança avançada", "Assinaturas profissionais", "IA para e-mails"],
        },
        {
          icon: Building2, name: "E-mail Enterprise", price: "Sob consulta", tag: "Corporativo",
          features: ["+10 contas", "Migração completa", "Domínio empresarial", "Segurança corporativa", "Suporte dedicado"],
          cta: "Falar com vendas",
        },
      ]}
    />
  );
}
