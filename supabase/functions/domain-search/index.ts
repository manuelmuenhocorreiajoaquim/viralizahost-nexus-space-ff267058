import { corsHeaders } from "../_shared/cors.ts";

// Fallback prices in BRL when provider doesn't return pricing or isn't configured.
const FALLBACK_PRICES_BRL: Record<string, number> = {
  ".com": 59,
  ".com.br": 49,
  ".net": 69,
  ".org": 69,
  ".io": 199,
  ".dev": 89,
  ".app": 89,
  ".co": 149,
  ".xyz": 39,
  ".store": 99,
  ".online": 79,
  ".tech": 99,
  ".site": 49,
  ".ao": 250,
  ".co.ao": 350,
};

const DEFAULT_TLDS = [".com", ".com.br", ".net", ".org", ".io", ".co", ".app", ".dev"];

function tldOf(domain: string): string {
  const m = domain.match(/\.[^.]+(?:\.[^.]+)?$/);
  return m ? m[0] : "";
}

function sanitize(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\..*$/, "")
    .replace(/[^a-z0-9-]/g, "");
}

// Convert USD to BRL approximate (only for fallback display when provider returns USD)
const USD_TO_BRL = 5.4;

type DomainResult = {
  domain: string;
  ext: string;
  available: boolean;
  priceBRL: number;
  source: "provider" | "fallback";
};

async function checkWithNamesilo(domains: string[], apiKey: string): Promise<DomainResult[] | null> {
  try {
    const url = `https://www.namesilo.com/api/checkRegisterAvailability?version=1&type=json&key=${encodeURIComponent(apiKey)}&domains=${encodeURIComponent(domains.join(","))}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    const reply = data?.reply;
    if (!reply) return null;

    const out: DomainResult[] = [];
    const available = reply.available?.domain ?? [];
    const unavailable = reply.unavailable?.domain ?? [];
    const availArr = Array.isArray(available) ? available : [available];
    const unavailArr = Array.isArray(unavailable) ? unavailable : [unavailable];

    for (const d of availArr) {
      if (!d) continue;
      const name = typeof d === "string" ? d : d.name ?? d["#text"] ?? "";
      const priceUsd = typeof d === "object" ? Number(d.price ?? 0) : 0;
      if (!name) continue;
      const ext = tldOf(name);
      const priceBRL = priceUsd > 0
        ? Math.round(priceUsd * USD_TO_BRL)
        : FALLBACK_PRICES_BRL[ext] ?? 79;
      out.push({ domain: name, ext, available: true, priceBRL, source: "provider" });
    }
    for (const d of unavailArr) {
      if (!d) continue;
      const name = typeof d === "string" ? d : d.name ?? d["#text"] ?? "";
      if (!name) continue;
      const ext = tldOf(name);
      out.push({
        domain: name,
        ext,
        available: false,
        priceBRL: FALLBACK_PRICES_BRL[ext] ?? 79,
        source: "provider",
      });
    }
    return out;
  } catch (e) {
    console.error("Namesilo error:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, tlds } = await req.json();
    const clean = sanitize(query ?? "");
    if (!clean) {
      return new Response(JSON.stringify({ error: "Domínio inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const exts: string[] = Array.isArray(tlds) && tlds.length ? tlds : DEFAULT_TLDS;
    const domains = exts.map((e) => `${clean}${e.startsWith(".") ? e : `.${e}`}`);

    const apiKey = Deno.env.get("NAMESILO_API_KEY");
    let results: DomainResult[] | null = null;
    let configured = false;
    let providerError: string | null = null;

    if (apiKey) {
      configured = true;
      results = await checkWithNamesilo(domains, apiKey);
      if (!results) providerError = "Falha ao consultar provedor.";
    }

    // If provider is not configured or failed, return a fallback that the UI can
    // surface clearly. We do NOT fabricate availability.
    if (!results) {
      return new Response(
        JSON.stringify({
          configured,
          query: clean,
          results: [],
          warning: configured
            ? providerError
            : "Integração de domínio ainda não configurada. Adicione a API Key do provedor.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Log the search (best-effort, never blocks the response).
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      await fetch(`${supabaseUrl}/rest/v1/domain_search_logs`, {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ searched_domain: clean, results }),
      });
    } catch (e) {
      console.error("log error", e);
    }

    return new Response(
      JSON.stringify({ configured: true, query: clean, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("domain-search error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
