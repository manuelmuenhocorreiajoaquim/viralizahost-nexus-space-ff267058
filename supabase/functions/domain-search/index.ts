import { corsHeaders } from "../_shared/cors.ts";

// Tabela OFICIAL de preços ViralizaHost (BRL/ano).
// Esta é a única fonte de verdade dos preços de domínio.
// O preço retornado pela API de disponibilidade é IGNORADO — usado apenas para verificar disponibilidade.
const OFFICIAL_PRICES_BRL: Record<string, number> = {
  ".com": 59,
  ".com.br": 49,
  ".ao": 250,
  ".co.ao": 350,
  ".net": 69,
  ".org": 69,
  ".tech": 49,
  ".store": 28,
  ".cloud": 29,
  // Extensões adicionais (preço padrão para TLDs não listados na tabela oficial)
  ".io": 199,
  ".dev": 89,
  ".app": 89,
  ".co": 149,
  ".xyz": 39,
  ".online": 79,
  ".site": 49,
};
const DEFAULT_PRICE_BRL = 79;

const PRIMARY_TLDS = [
  ".com",
  ".net",
  ".org",
  ".com.br",
  ".ao",
  ".co.ao",
  ".tech",
  ".cloud",
  ".store",
];

const SUGGESTION_TLDS = [".com", ".net", ".com.br", ".cloud", ".store"];
const USD_TO_BRL = 5.4;

type ProviderSource = "provider" | "fallback" | "suggestion";
type AvailabilityStatus = "available" | "taken" | "suggestion";

type DomainResult = {
  domain: string;
  ext: string;
  available: boolean;
  status: AvailabilityStatus;
  priceBRL: number;
  source: ProviderSource;
  suggested?: boolean;
};

type ProviderItem = {
  domain: string;
  available: boolean;
  priceBRL?: number;
};

function tldOf(domain: string): string {
  const multiPart = domain.match(/\.(?:com\.br|co\.ao)$/);
  if (multiPart) return multiPart[0];
  const simple = domain.match(/\.[^.]+$/);
  return simple ? simple[0] : ".com";
}

function withoutTld(domain: string): string {
  return domain.replace(/\.(?:com\.br|co\.ao)$/, "").replace(/\.[^.]+$/, "");
}

function sanitize(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\..*$/, "")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

function isValidDomain(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(value);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildCandidateDomains(base: string): string[] {
  const variants = unique([
    base,
    `${base}angola`,
    `${base}brasil`,
    `${base}host`,
    `get${base}`,
    `use${base}`,
  ]);

  const candidates: string[] = [];
  for (const tld of PRIMARY_TLDS) candidates.push(`${base}${tld}`);
  for (const variant of variants.slice(1)) {
    for (const tld of SUGGESTION_TLDS) candidates.push(`${variant}${tld}`);
  }

  return unique(candidates).filter(isValidDomain).slice(0, 40);
}

function fallbackPrice(domain: string): number {
  return FALLBACK_PRICES_BRL[tldOf(domain)] ?? 79;
}

function priceToBRL(raw: unknown, domain: string): number {
  const parsed = Number(String(raw ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackPrice(domain);
  return Math.max(1, Math.round(parsed * USD_TO_BRL));
}

function makeFallbackResults(domains: string[], base: string, source: ProviderSource): DomainResult[] {
  return domains.map((domain) => ({
    domain,
    ext: tldOf(domain),
    available: false,
    status: "suggestion",
    priceBRL: fallbackPrice(domain),
    source,
    suggested: withoutTld(domain) !== base,
  }));
}

function collectDomainItems(node: unknown, inheritedPrice?: unknown): ProviderItem[] {
  const out: ProviderItem[] = [];

  const pushDomain = (raw: unknown, price?: unknown) => {
    if (typeof raw !== "string") return;
    for (const part of raw.split(/[\s,;]+/)) {
      const domain = part.trim().toLowerCase();
      if (isValidDomain(domain)) out.push({ domain, available: true, priceBRL: priceToBRL(price, domain) });
    }
  };

  if (typeof node === "string") {
    pushDomain(node, inheritedPrice);
    return out;
  }

  if (Array.isArray(node)) {
    for (const item of node) out.push(...collectDomainItems(item, inheritedPrice));
    return out;
  }

  if (node && typeof node === "object") {
    const record = node as Record<string, unknown>;
    const attrs = (record["@attributes"] ?? record["$"]) as Record<string, unknown> | undefined;
    const price = record.price ?? record.registration_price ?? record.reg_price ?? attrs?.price ?? inheritedPrice;
    const direct = record.name ?? record.domainName ?? record["#text"] ?? record._ ?? attrs?.name;

    if (typeof direct === "string") pushDomain(direct, price);

    const nestedDomain = record.domain ?? record.domains;
    if (nestedDomain !== undefined) out.push(...collectDomainItems(nestedDomain, price));

    if (out.length === 0) {
      for (const value of Object.values(record)) out.push(...collectDomainItems(value, price));
    }
  }

  return out;
}

function parseNameSiloJson(payload: unknown): ProviderItem[] {
  const root = payload as Record<string, unknown>;
  const reply = (root?.reply ?? root) as Record<string, unknown>;
  const results: ProviderItem[] = [];

  const availableNode = reply.available ?? reply.available_domains ?? reply.Available;
  const unavailableNode = reply.unavailable ?? reply.registered ?? reply.unavailable_domains ?? reply.Unavailable;

  for (const item of collectDomainItems(availableNode)) {
    results.push({ ...item, available: true });
  }

  for (const item of collectDomainItems(unavailableNode)) {
    results.push({ ...item, available: false });
  }

  const loose = reply.domain ?? reply.domains;
  if (results.length === 0 && loose !== undefined) {
    const code = Number(reply.code ?? reply.status_code ?? 0);
    const available = String(reply.available ?? "").toLowerCase();
    const isAvailable = available === "yes" || available === "true" || code === 300;
    for (const item of collectDomainItems(loose)) {
      results.push({ ...item, available: isAvailable });
    }
  }

  return results;
}

function nodeDomainValue(node: Element): string {
  return (node.getAttribute("name") || node.textContent || "").trim().toLowerCase();
}

function nodePrice(node: Element, domain: string): number {
  return priceToBRL(
    node.getAttribute("price") ||
      node.getAttribute("registration_price") ||
      node.getAttribute("reg_price") ||
      node.getAttribute("amount"),
    domain,
  );
}

function hasAncestorTag(node: Element, tag: string): boolean {
  let current = node.parentElement;
  while (current) {
    if (current.tagName.toLowerCase() === tag) return true;
    current = current.parentElement;
  }
  return false;
}

function parseNameSiloXml(xml: string): ProviderItem[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  const results: ProviderItem[] = [];

  for (const node of doc.querySelectorAll("available domain")) {
    const domain = nodeDomainValue(node);
    if (isValidDomain(domain)) results.push({ domain, available: true, priceBRL: nodePrice(node, domain) });
  }

  for (const node of doc.querySelectorAll("unavailable domain, registered domain")) {
    const domain = nodeDomainValue(node);
    if (isValidDomain(domain)) results.push({ domain, available: false, priceBRL: nodePrice(node, domain) });
  }

  for (const node of doc.querySelectorAll("domain")) {
    const domain = nodeDomainValue(node);
    if (!isValidDomain(domain)) continue;
    if (hasAncestorTag(node, "available") || hasAncestorTag(node, "unavailable") || hasAncestorTag(node, "registered")) continue;

    const availableAttr = (node.getAttribute("available") || node.getAttribute("avail") || "").toLowerCase();
    const code = Number(node.getAttribute("code") || node.getAttribute("status") || 0);
    const available = availableAttr === "yes" || availableAttr === "true" || code === 300;
    results.push({ domain, available, priceBRL: nodePrice(node, domain) });
  }

  return results;
}

async function fetchNameSilo(domains: string[], apiKey: string, responseType: "json" | "xml"): Promise<ProviderItem[] | null> {
  const url = new URL("https://www.namesilo.com/api/checkRegisterAvailability");
  url.searchParams.set("version", "1");
  url.searchParams.set("type", responseType);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("domains", domains.join(","));

  const res = await fetch(url.toString(), {
    headers: { Accept: responseType === "json" ? "application/json" : "application/xml,text/xml" },
    signal: AbortSignal.timeout(12000),
  });
  const text = await res.text();

  console.log(`[domain-search] NameSilo ${responseType} status:`, res.status);
  console.log(`[domain-search] NameSilo ${responseType} raw response:`, text);

  if (!res.ok) return null;

  try {
    if (responseType === "json") return parseNameSiloJson(JSON.parse(text));
    return parseNameSiloXml(text);
  } catch (error) {
    console.error(`[domain-search] Failed to parse NameSilo ${responseType}:`, error);
    return null;
  }
}

async function checkWithNamesilo(domains: string[], apiKey: string): Promise<ProviderItem[] | null> {
  try {
    const jsonResults = await fetchNameSilo(domains, apiKey, "json");
    if (jsonResults && jsonResults.length > 0) return jsonResults;

    console.log("[domain-search] JSON parser returned no domains, retrying XML parser.");
    const xmlResults = await fetchNameSilo(domains, apiKey, "xml");
    if (xmlResults && xmlResults.length > 0) return xmlResults;

    return jsonResults ?? xmlResults;
  } catch (error) {
    console.error("[domain-search] NameSilo request failed:", error);
    return null;
  }
}

function mergeProviderResults(domains: string[], parsed: ProviderItem[], base: string): DomainResult[] {
  const byDomain = new Map<string, ProviderItem>();
  for (const item of parsed) byDomain.set(item.domain.toLowerCase(), item);

  const results = domains.map((domain) => {
    const item = byDomain.get(domain);
    if (!item) {
      return {
        domain,
        ext: tldOf(domain),
        available: false,
        status: "suggestion" as const,
        priceBRL: fallbackPrice(domain),
        source: "suggestion" as const,
        suggested: withoutTld(domain) !== base,
      };
    }

    return {
      domain,
      ext: tldOf(domain),
      available: item.available,
      status: item.available ? ("available" as const) : ("taken" as const),
      priceBRL: item.priceBRL ?? fallbackPrice(domain),
      source: "provider" as const,
      suggested: withoutTld(domain) !== base,
    };
  });

  return results.sort((a, b) => {
    if (a.status === b.status) return domains.indexOf(a.domain) - domains.indexOf(b.domain);
    const order: Record<AvailabilityStatus, number> = { available: 0, taken: 1, suggestion: 2 };
    return order[a.status] - order[b.status];
  });
}

async function logSearch(query: string, results: DomainResult[]) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return;

    await fetch(`${supabaseUrl}/rest/v1/domain_search_logs`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ searched_domain: query, results }),
    });
  } catch (error) {
    console.error("[domain-search] Search log error:", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query } = await req.json();
    const clean = sanitize(query ?? "");

    if (!clean) {
      return new Response(JSON.stringify({ error: "Domínio inválido", results: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domains = buildCandidateDomains(clean);
    const apiKey = Deno.env.get("NAMESILO_API_KEY");

    console.log("[domain-search] Request:", { query: clean, candidates: domains });

    if (!apiKey) {
      const fallbackResults = makeFallbackResults(domains, clean, "fallback");
      return new Response(
        JSON.stringify({
          configured: false,
          query: clean,
          results: fallbackResults,
          warning: "Não foi possível consultar o domínio. Integração de domínio ainda não configurada.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsed = await checkWithNamesilo(domains, apiKey);

    if (!parsed || parsed.length === 0) {
      const fallbackResults = makeFallbackResults(domains, clean, "fallback");
      await logSearch(clean, fallbackResults);
      return new Response(
        JSON.stringify({
          configured: true,
          query: clean,
          results: fallbackResults,
          warning: "Não foi possível consultar o domínio. Mostrando sugestões alternativas para tentar novamente.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const results = mergeProviderResults(domains, parsed, clean);
    await logSearch(clean, results);

    return new Response(JSON.stringify({ configured: true, query: clean, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[domain-search] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        configured: true,
        query: null,
        results: [],
        warning: "Não foi possível consultar o domínio. Tente novamente em instantes.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
