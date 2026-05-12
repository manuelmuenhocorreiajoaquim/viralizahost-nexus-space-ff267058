// Unified product catalog for the checkout flow.
// Prices are in BRL (monthly base). AKZ conversion happens at display time
// via the existing currency layer.

export type ProductType =
  | "hosting"
  | "vps"
  | "email"
  | "domain"
  | "ai"
  | "traffic"
  | "design"
  | "audiovisual";

export type Product = {
  id: string;
  type: ProductType;
  name: string;
  basePriceBRL: number; // monthly
  /** True if hosting-class product (eligible for domain step). */
  needsDomain?: boolean;
  /** True if it makes sense to upsell email plan after this product. */
  emailUpsell?: boolean;
};

export const CATALOG: Product[] = [
  // Hospedagem
  { id: "host-start", type: "hosting", name: "Host Start", basePriceBRL: 19, needsDomain: true, emailUpsell: true },
  { id: "host-pro", type: "hosting", name: "Host Pro", basePriceBRL: 49, needsDomain: true, emailUpsell: true },
  { id: "host-business", type: "hosting", name: "Host Business", basePriceBRL: 99, needsDomain: true, emailUpsell: true },
  { id: "host-cloud", type: "hosting", name: "Cloud Premium", basePriceBRL: 199, needsDomain: true, emailUpsell: true },
  // VPS
  { id: "vps-1", type: "vps", name: "VPS NVMe 1", basePriceBRL: 79 },
  { id: "vps-2", type: "vps", name: "VPS NVMe 2", basePriceBRL: 149 },
  { id: "vps-3", type: "vps", name: "VPS NVMe 3", basePriceBRL: 299 },
  // Email
  { id: "email-pro", type: "email", name: "Email Pro", basePriceBRL: 12 },
  { id: "email-business", type: "email", name: "Email Business", basePriceBRL: 24 },
  { id: "email-enterprise", type: "email", name: "Email Enterprise", basePriceBRL: 49 },
  // IA
  { id: "ai-start", type: "ai", name: "IA Start", basePriceBRL: 350 },
  { id: "ai-pro", type: "ai", name: "IA Pro", basePriceBRL: 890 },
  { id: "ai-enterprise", type: "ai", name: "IA Enterprise", basePriceBRL: 2400 },
  // Tráfego pago
  { id: "traf-start", type: "traffic", name: "Tráfego Start", basePriceBRL: 350 },
  { id: "traf-meta", type: "traffic", name: "Meta Ads Starter", basePriceBRL: 500 },
  { id: "traf-perf", type: "traffic", name: "Performance Business", basePriceBRL: 1200 },
  { id: "traf-growth", type: "traffic", name: "Growth Premium", basePriceBRL: 2500 },
  // Design
  { id: "design-essential", type: "design", name: "Design Essential", basePriceBRL: 690 },
  { id: "design-brand", type: "design", name: "Brand Premium", basePriceBRL: 1490 },
  { id: "design-studio", type: "design", name: "Studio Completo", basePriceBRL: 2890 },
  // Audiovisual
  { id: "av-reels", type: "audiovisual", name: "Pacote Reels", basePriceBRL: 990 },
  { id: "av-vsl", type: "audiovisual", name: "VSL Premium", basePriceBRL: 2490 },
  { id: "av-studio", type: "audiovisual", name: "Studio Audiovisual", basePriceBRL: 4990 },
];

export function findProduct(id: string): Product | undefined {
  return CATALOG.find((p) => p.id === id);
}

export type CycleId = "monthly" | "semestral" | "annual" | "biennial" | "triennial";

export type Cycle = {
  id: CycleId;
  label: string;
  months: number;
  /** Discount applied to base monthly price. */
  discountPct: number;
  badge?: string;
};

export const CYCLES: Cycle[] = [
  { id: "monthly", label: "Mensal", months: 1, discountPct: 0 },
  { id: "semestral", label: "6 Meses", months: 6, discountPct: 15, badge: "15% OFF" },
  { id: "annual", label: "1 Ano", months: 12, discountPct: 30, badge: "30% OFF" },
  { id: "biennial", label: "2 Anos", months: 24, discountPct: 45, badge: "45% OFF" },
  { id: "triennial", label: "3 Anos", months: 36, discountPct: 55, badge: "55% OFF" },
];

export function findCycle(id: CycleId): Cycle {
  return CYCLES.find((c) => c.id === id) ?? CYCLES[0];
}

/** Effective monthly price after cycle discount. */
export function monthlyPrice(base: number, cycle: Cycle): number {
  return Math.round(base * (1 - cycle.discountPct / 100) * 100) / 100;
}

/** Total amount billed up-front for the chosen cycle. */
export function cyclePeriodTotal(base: number, cycle: Cycle): number {
  return Math.round(monthlyPrice(base, cycle) * cycle.months * 100) / 100;
}

/** Savings vs paying monthly for the same number of months. */
export function cycleSavings(base: number, cycle: Cycle): number {
  const full = base * cycle.months;
  return Math.round((full - cyclePeriodTotal(base, cycle)) * 100) / 100;
}
