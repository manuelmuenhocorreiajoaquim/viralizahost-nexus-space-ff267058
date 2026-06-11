import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getServicePlans } from "@/lib/cms.functions";
import type { Plan } from "@/components/site/PlansGrid";

export type CmsOverride = {
  name?: string;
  price?: string;
  features?: string[];
  tag?: string;
};

/**
 * Fetches active CMS service_plans for a category and merges them over a
 * hardcoded fallback list. Matching is by slug == productId.
 * If the DB returns nothing, the fallback is used unchanged so the site
 * never breaks while the CMS is being populated.
 */
export function useCmsPlans<T extends Plan>(category: string, fallback: T[]): T[] {
  const fetcher = useServerFn(getServicePlans);
  const { data } = useQuery({
    queryKey: ["cms-plans", category],
    queryFn: () => fetcher({ data: { category } }),
    staleTime: 60_000,
    retry: false,
  });

  if (!data || data.length === 0) return fallback;

  const bySlug = new Map<string, any>();
  for (const row of data as any[]) {
    if (row?.slug) bySlug.set(row.slug, row);
  }

  return fallback.map((p) => {
    if (!p.productId) return p;
    const row = bySlug.get(p.productId);
    if (!row) return p;
    const next: any = { ...p };
    if (row.name) next.name = row.name;
    if (row.price_brl != null) next.price = `R$ ${Number(row.price_brl).toLocaleString("pt-BR")}`;
    if (Array.isArray(row.benefits) && row.benefits.length > 0) next.features = row.benefits;
    if (row.badge) next.tag = row.badge;
    return next as T;
  });
}
