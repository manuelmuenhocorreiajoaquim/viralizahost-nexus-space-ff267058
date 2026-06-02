export const DOMAIN_MARGINS = {
  ".com": 25,
  ".net": 30,
  ".org": 30,
  ".com.br": 20,
  ".ao": 40,
  default: 35,
} as const;

export type DomainMarginTld = keyof typeof DOMAIN_MARGINS;

export function normalizeTld(tld: string): string {
  const cleaned = tld.trim().toLowerCase();
  return cleaned.startsWith(".") ? cleaned : `.${cleaned}`;
}

export function getDomainMarginPercent(tld: string | null | undefined): number {
  if (!tld) return DOMAIN_MARGINS.default;
  const normalized = normalizeTld(tld);
  return DOMAIN_MARGINS[normalized as DomainMarginTld] ?? DOMAIN_MARGINS.default;
}

export function applyDomainMargin(hostingerPrice: number, tld: string): number {
  const margin = getDomainMarginPercent(tld);
  return Math.round(hostingerPrice * (1 + margin / 100) * 100) / 100;
}