import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDomainExtensions } from "@/lib/cms.functions";
import {
  DOMAIN_FIXED_PRICES,
  normalizeTld,
  type FixedDomainPrice,
} from "@/config/domainFixedPrices";

export type DomainExtensionRow = {
  id: string;
  ext: string;
  slug: string;
  price_brl: number;
  price_aoa: number;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
};

const FALLBACK: DomainExtensionRow[] = Object.entries(DOMAIN_FIXED_PRICES).map(
  ([ext, p], i) => ({
    id: ext,
    ext,
    slug: ext.replace(/^\./, "").replace(/\./g, "-"),
    price_brl: p.brl,
    price_aoa: p.akz,
    is_active: true,
    is_featured: ext === ".com",
    sort_order: (i + 1) * 10,
  }),
);

export function useDomainExtensions() {
  const fn = useServerFn(getDomainExtensions);
  const q = useQuery({
    queryKey: ["domain-extensions"],
    queryFn: async () => {
      try {
        const rows = (await fn()) as unknown as DomainExtensionRow[];
        if (!rows?.length) return FALLBACK;
        return rows;
      } catch {
        return FALLBACK;
      }
    },
    staleTime: 60_000,
  });

  const data = q.data ?? FALLBACK;
  return { data, isLoading: q.isLoading };
}

/** Returns visible extensions filtered by currency (BRL hides .ao / .co.ao). */
export function filterDomainsByCurrency(
  rows: DomainExtensionRow[],
  currency: string,
): DomainExtensionRow[] {
  if (currency === "AKZ") return rows;
  return rows.filter((d) => d.ext !== ".ao" && d.ext !== ".co.ao");
}

/** Helper to read price from a fetched row list with safe fallback. */
export function priceFromRows(
  rows: DomainExtensionRow[] | undefined,
  ext: string,
): FixedDomainPrice {
  const key = normalizeTld(ext) ?? ext;
  const found = rows?.find((r) => r.ext === key);
  if (found) return { brl: Number(found.price_brl), akz: Number(found.price_aoa) };
  return DOMAIN_FIXED_PRICES[key] ?? { brl: 59, akz: 20_000 };
}
