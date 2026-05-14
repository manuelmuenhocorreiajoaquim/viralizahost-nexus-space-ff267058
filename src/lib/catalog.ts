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
  /** For monthly products: monthly base price. For annual products (domains): yearly fixed price. */
  basePriceBRL: number;
  /** "monthly" applies cycle discount/multiplier; "annual" is a fixed yearly price (no cycle). */
  billing?: "monthly" | "annual";
  /** True if hosting-class product (eligible for domain step). */
  needsDomain?: boolean;
  /** True if it makes sense to upsell email plan after this product. */
  emailUpsell?: boolean;
};

export function isAnnualProduct(p: Product): boolean {
  return p.billing === "annual" || p.type === "domain";
}

/** One-off / project-based services billed as a single delivery (no monthly cycle). */
const ONE_TIME_TYPES: ReadonlyArray<ProductType> = ["ai", "traffic", "design", "audiovisual"];
export function isOneTimeService(p: Product): boolean {
  return ONE_TIME_TYPES.includes(p.type);
}

/** Whether the product needs a domain to be configured during checkout. */
export function productRequiresDomain(p: Product): boolean {
  return Boolean(p.needsDomain) || p.type === "domain";
}

/** Whether the product participates in the cycle (monthly/semestral/annual...) selector. */
export function productNeedsCycle(p: Product): boolean {
  return !isAnnualProduct(p) && !isOneTimeService(p);
}

export const CATALOG: Product[] = [
  // Hospedagem
  { id: "host-start", type: "hosting", name: "Starter Host", basePriceBRL: 19, needsDomain: true, emailUpsell: true },
  { id: "host-business", type: "hosting", name: "Business Cloud", basePriceBRL: 79, needsDomain: true, emailUpsell: true },
  { id: "host-pro", type: "hosting", name: "Cloud Pro", basePriceBRL: 159, needsDomain: true, emailUpsell: true },
  { id: "host-revenda", type: "hosting", name: "Revenda WHM", basePriceBRL: 249, needsDomain: true, emailUpsell: true },
  // VPS
  { id: "vps-1", type: "vps", name: "VPS NVMe 1", basePriceBRL: 79 },
  { id: "vps-2", type: "vps", name: "VPS NVMe 2", basePriceBRL: 149 },
  { id: "vps-3", type: "vps", name: "VPS NVMe 3", basePriceBRL: 299 },
  // Email — preços alinhados à vitrine (todos exigem domínio)
  { id: "email-starter", type: "email", name: "E-mail Starter", basePriceBRL: 29, needsDomain: true },
  { id: "email-business", type: "email", name: "E-mail Business", basePriceBRL: 59, needsDomain: true },
  { id: "email-premium", type: "email", name: "E-mail Premium", basePriceBRL: 99, needsDomain: true },
  // IA
  { id: "ai-chatbot-starter", type: "ai", name: "Chatbot IA Starter", basePriceBRL: 299 },
  { id: "ai-automation-business", type: "ai", name: "Automação Business", basePriceBRL: 799 },
  { id: "ai-agent-premium", type: "ai", name: "Agente IA Premium", basePriceBRL: 1499 },
  { id: "ai-start", type: "ai", name: "IA Start", basePriceBRL: 350 },
  { id: "ai-pro", type: "ai", name: "IA Pro", basePriceBRL: 890 },
  { id: "ai-enterprise", type: "ai", name: "IA Enterprise", basePriceBRL: 2400 },
  // Tráfego pago
  { id: "traf-start", type: "traffic", name: "Tráfego Start", basePriceBRL: 350 },
  { id: "traf-meta", type: "traffic", name: "Meta Ads Starter", basePriceBRL: 500 },
  { id: "traf-perf", type: "traffic", name: "Performance Business", basePriceBRL: 1200 },
  { id: "traf-growth", type: "traffic", name: "Growth Premium", basePriceBRL: 2500 },
  // Design
  { id: "design-flyer", type: "design", name: "Flyer Digital", basePriceBRL: 80 },
  { id: "design-social-kit", type: "design", name: "Social Media Kit", basePriceBRL: 350 },
  { id: "design-branding-premium", type: "design", name: "Branding Premium", basePriceBRL: 1500 },
  { id: "design-essential", type: "design", name: "Design Essential", basePriceBRL: 690 },
  { id: "design-brand", type: "design", name: "Brand Premium", basePriceBRL: 1490 },
  { id: "design-studio", type: "design", name: "Studio Completo", basePriceBRL: 2890 },
  // Audiovisual
  { id: "av-reels-prof", type: "audiovisual", name: "Reels Profissional", basePriceBRL: 250 },
  { id: "av-institutional", type: "audiovisual", name: "Vídeo Institucional", basePriceBRL: 1500 },
  { id: "av-event", type: "audiovisual", name: "Cobertura de Evento", basePriceBRL: 2500 },
  { id: "av-reels", type: "audiovisual", name: "Pacote Reels", basePriceBRL: 990 },
  { id: "av-vsl", type: "audiovisual", name: "VSL Premium", basePriceBRL: 2490 },
  { id: "av-studio", type: "audiovisual", name: "Studio Audiovisual", basePriceBRL: 4990 },
];

export function findProduct(id: string): Product | undefined {
  return CATALOG.find((p) => p.id === id);
}

/**
 * Register a domain as a purchasable product (mock pricing).
 * `priceBRLAnnual` is the yearly registration price in BRL.
 * Stored as a `basePriceBRL` of priceAnnual/12 so 12-month cycle ≈ annual cost.
 */
export function registerDomainProduct(domain: string, priceBRLAnnual: number): Product {
  const id = `domain:${domain.toLowerCase()}`;
  const existing = CATALOG.find((p) => p.id === id);
  if (existing) {
    // Keep price in sync with latest search result.
    existing.basePriceBRL = priceBRLAnnual;
    existing.billing = "annual";
    return existing;
  }
  const product: Product = {
    id,
    type: "domain",
    name: domain.toLowerCase(),
    basePriceBRL: priceBRLAnnual,
    billing: "annual",
  };
  CATALOG.push(product);
  return product;
}

/** Unit price shown for an item (per month for recurring, per year for annual, per project for one-time). */
export function productUnitPrice(product: Product, cycle: Cycle): number {
  if (isAnnualProduct(product) || isOneTimeService(product)) return product.basePriceBRL;
  return monthlyPrice(product.basePriceBRL, cycle);
}

/** Total billed for one quantity unit over the chosen cycle. */
export function productPeriodTotal(product: Product, cycle: Cycle): number {
  if (isAnnualProduct(product) || isOneTimeService(product)) return product.basePriceBRL;
  return cyclePeriodTotal(product.basePriceBRL, cycle);
}

/** Reference subtotal (no cycle discount) for one unit, used to compute discount display. */
export function productSubtotalRef(product: Product, cycle: Cycle): number {
  if (isAnnualProduct(product) || isOneTimeService(product)) return product.basePriceBRL;
  return Math.round(product.basePriceBRL * cycle.months * 100) / 100;
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
