// Fixed retail prices for domain registration (1 year).
// Single source of truth for: domain search modal, cart, checkout, admin.
// Hostinger pricing is no longer used to derive the customer price.

export type DomainCurrency = "BRL" | "AKZ";

export type FixedDomainPrice = {
  /** Annual price in BRL (default). Used for cart/payments which run in BRL. */
  brl: number;
  /** Annual price in AKZ (display + manual orders in AKZ). */
  akz: number;
};

/** Authoritative price table per TLD. Keys MUST start with ".". */
export const DOMAIN_FIXED_PRICES: Record<string, FixedDomainPrice> = {
  ".com": { brl: 59, akz: 20_000 },
  ".com.br": { brl: 49, akz: 15_000 },
  ".net": { brl: 69, akz: 12_900 },
  ".org": { brl: 69, akz: 12_900 },
  ".ao": { brl: 250, akz: 46_500 },
  ".co.ao": { brl: 350, akz: 65_000 },
};

/** Fallback used when an unmapped TLD slips through (matches .com pricing). */
export const DOMAIN_FALLBACK_PRICE: FixedDomainPrice = { brl: 59, akz: 20_000 };

export function normalizeTld(tld: string | null | undefined): string | null {
  if (!tld) return null;
  const cleaned = tld.trim().toLowerCase();
  if (!cleaned) return null;
  return cleaned.startsWith(".") ? cleaned : `.${cleaned}`;
}

export function getFixedDomainPrice(tld: string | null | undefined): FixedDomainPrice {
  const key = normalizeTld(tld);
  if (!key) return DOMAIN_FALLBACK_PRICE;
  return DOMAIN_FIXED_PRICES[key] ?? DOMAIN_FALLBACK_PRICE;
}

/** Annual BRL price for a TLD (used everywhere in the BRL checkout flow). */
export function getDomainPriceBRL(tld: string | null | undefined): number {
  return getFixedDomainPrice(tld).brl;
}

/** Annual AKZ price for a TLD (for AKZ-native display where needed). */
export function getDomainPriceAKZ(tld: string | null | undefined): number {
  return getFixedDomainPrice(tld).akz;
}

/** Total price for N years (simple multiplication — no implicit discounts). */
export function getDomainTotalBRL(
  tld: string | null | undefined,
  years: number,
): number {
  const y = Math.max(1, Math.trunc(years) || 1);
  return Math.round(getDomainPriceBRL(tld) * y * 100) / 100;
}

/** Human-readable status mapping for the manual activation flow. */
export const DOMAIN_ORDER_STATUS = {
  PENDING_ACTIVATION: "PENDENTE_ATIVACAO",
  ACTIVE: "ATIVO",
  CANCELLED: "CANCELADO",
} as const;

export type DomainOrderStatus =
  (typeof DOMAIN_ORDER_STATUS)[keyof typeof DOMAIN_ORDER_STATUS];

export const DOMAIN_ORDER_STATUS_LABEL: Record<string, string> = {
  PENDENTE_ATIVACAO: "Pendente de Ativação",
  ATIVO: "Ativo",
  CANCELADO: "Cancelado",
  // Legacy fallbacks (old rows created before this migration).
  pending: "Pendente de Ativação",
};
