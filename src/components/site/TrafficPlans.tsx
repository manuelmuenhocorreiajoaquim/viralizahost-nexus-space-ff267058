import { Sparkles, Megaphone, TrendingUp, Rocket } from "lucide-react";
import PlansGrid from "./PlansGrid";
import { useCmsPlans } from "@/lib/use-cms-plans";

const fallback = [
  {
    icon: Sparkles, name: "Tráfego Start", price: "R$ 350", per: "/mês", tag: "Início", productId: "traf-start",
    features: ["Campanha inicial Meta Ads", "1 público personalizado", "Configuração básica", "1 relatório mensal"],
  },
  {
    icon: Megaphone, name: "Meta Ads Starter", price: "R$ 500", per: "/mês", tag: "Entrada", productId: "traf-meta",
    features: ["Campanhas Instagram/Facebook", "2 criativos por mês", "Relatório mensal", "Pixel & eventos"],
  },
  {
    icon: TrendingUp, name: "Performance Business", price: "R$ 1.200", per: "/mês", tag: "Mais escolhido", popular: true, productId: "traf-perf",
    features: ["Meta Ads + Google Ads", "Remarketing avançado", "Otimização semanal", "Relatório executivo", "Gestor dedicado"],
  },
  {
    icon: Rocket, name: "Growth Premium", price: "R$ 2.500", per: "/mês", tag: "Escala", productId: "traf-growth",
    features: ["Estratégia completa", "Funil de vendas", "Google, Meta e YouTube", "Consultoria mensal", "Squad dedicado"],
  },
];

export default function TrafficPlans() {
  const plans = useCmsPlans("marketing", fallback);
  return (
    <PlansGrid
      id="trafego"
      eyebrow="Tráfego Pago"
      title="Gestão de tráfego pago para vender mais"
      desc="Campanhas de alta performance com criativos, otimização e relatórios executivos."
      plans={plans}
    />
  );
}
