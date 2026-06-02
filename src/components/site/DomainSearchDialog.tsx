import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Globe,
  Check,
  X,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Search as SearchIcon,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useServerFn } from "@tanstack/react-start";
import { searchDomainsHostinger } from "@/lib/provisioning.functions";
import { useCurrency, formatPrice } from "@/lib/currency";
import { useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { registerDomainProduct } from "@/lib/catalog";
import { toast } from "sonner";

export type DomainPricingTier = {
  years: 1 | 2 | 3;
  price_hostinger: number | null;
  renewal_price?: number | null;
  promotional_price?: number | null;
  icann_fee?: number | null;
  whois_price?: number | null;
  margin_percent?: number;
  price_final: number | null;
  item_id: string | null;
  unavailable?: boolean;
};

export type DomainResult = {
  domain: string;
  ext: string;
  priceBRL: number;
  price_hostinger?: number | null;
  available: boolean;
  status?: "available" | "taken" | "suggestion";
  source?: string;
  suggested?: boolean;
  pricing?: {
    "1y": DomainPricingTier;
    "2y": DomainPricingTier;
    "3y": DomainPricingTier;
  };
};

type PeriodKey = "1y" | "2y" | "3y";
const PERIOD_OPTIONS: { key: PeriodKey; years: 1 | 2 | 3; label: string }[] = [
  { key: "1y", years: 1, label: "1 ano" },
  { key: "2y", years: 2, label: "2 anos" },
  { key: "3y", years: 3, label: "3 anos" },
];

function sanitize(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\..*$/, "")
    .replace(/[^a-z0-9-]/g, "");
}

export default function DomainSearchDialog({
  open,
  onOpenChange,
  query,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  query: string;
}) {
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<DomainResult[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const navigate = useNavigate();
  const { add, setDomain, setCycle } = useCart();

  const cleanQuery = useMemo(() => sanitize(query), [query]);
  const searchFn = useServerFn(searchDomainsHostinger);

  useEffect(() => {
    if (!open || !cleanQuery) return;
    let cancelled = false;
    setLoading(true);
    setWarning(null);
    setResults([]);
    setShowAlternatives(false);

    (async () => {
      try {
        console.log("[domain-search] start (hostinger)", { query: cleanQuery });
        const hres: any = await searchFn({ data: { query: cleanQuery } });
        if (cancelled) return;
        const hResults = Array.isArray(hres?.results) ? hres.results : [];
        setResults(hResults);
        setWarning(hres?.warning ?? (hResults.length === 0 ? "Não foi possível consultar agora. Tente novamente." : null));
      } catch (e: unknown) {
        if (cancelled) return;
        console.error("[domain-search] failed", e);
        setResults([]);
        setWarning("Não foi possível consultar agora. Tente novamente.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, cleanQuery]);

  // Per-domain period selection (default 1 year).
  const [periodByDomain, setPeriodByDomain] = useState<Record<string, PeriodKey>>({});
  const periodFor = (domain: string): PeriodKey => periodByDomain[domain] ?? "1y";

  const tierFor = (r: DomainResult, key: PeriodKey): DomainPricingTier => {
    if (r.pricing) return r.pricing[key];
    const years = (key === "2y" ? 2 : key === "3y" ? 3 : 1) as 1 | 2 | 3;
    // Sem dados de provider — preço indisponível (nunca inventamos valor).
    return {
      years,
      price_hostinger: null,
      price_final: null,
      item_id: null,
      unavailable: true,
    };
  };

  const buy = (r: DomainResult) => {
    const key = periodFor(r.domain);
    const tier = tierFor(r, key);
    if (!r.available) {
      toast.error("Domínio ocupado ou não confirmado pela Hostinger.");
      return;
    }
    if (tier.price_final == null || tier.unavailable) {
      toast.error("Preço indisponível temporariamente. Tente novamente em instantes.");
      return;
    }
    // Invariante: final >= provider (validação no servidor, garantia no cliente).
    if (tier.price_hostinger != null && tier.price_final < tier.price_hostinger) {
      toast.error("Erro de preço. Recarregue a pesquisa.");
      return;
    }
    const totalPrice = Number(tier.price_final.toFixed(2));
    const product = registerDomainProduct(r.domain, totalPrice);
    add(product.id, {
      domain: r.domain,
      name: r.domain,
      type: "domain",
      priceBRL: totalPrice,
      billing: "annual",
      qty: 1,
      metadata: {
        period: tier.years,
        period_unit: "year",
        tld: r.ext,
        price_hostinger: tier.price_hostinger,
        renewal_price: tier.renewal_price ?? null,
        promotional_price: tier.promotional_price ?? null,
        icann_fee: tier.icann_fee ?? null,
        whois_price: tier.whois_price ?? null,
        price_final: totalPrice,
        margin_percent: tier.margin_percent ?? null,
        hostinger_item_id: tier.item_id,
        availability_confirmed: true,
        availability_source: r.source ?? "hostinger",
        availability_status: r.status ?? "available",
      },
    });
    setDomain(product.id, r.domain);
    console.log("[domain-cart] added", {
      domain: r.domain,
      period: tier.years,
      provider_price: tier.price_hostinger,
      margin_percent: tier.margin_percent ?? null,
      final_price: totalPrice,
    });
    toast.success(`${r.domain} (${tier.years} ${tier.years === 1 ? "ano" : "anos"}) adicionado ao carrinho`);
    onOpenChange(false);
    navigate({ to: "/checkout", search: { step: "cart" } });
  };

  const availableCount = results.filter((r) => r.available).length;
  const takenCount = results.filter((r) => !r.available).length;
  const suggestionCount = results.filter((r) => r.available && (r.suggested || r.status === "suggestion")).length;
  const visibleResults = showAlternatives
    ? results.filter((r) => r.available && (r.suggested || r.status === "suggestion"))
    : results;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-card border-border shadow-2xl p-0 overflow-hidden">
          <div className="px-5 sm:px-7 pt-6 pb-5 border-b border-border bg-gradient-to-br from-primary/10 via-card to-accent/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-foreground">
                <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shadow-glow-soft">
                  <Globe className="h-5 w-5 text-primary-foreground" />
                </div>
                Resultados da pesquisa
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {cleanQuery ? (
                  <>
                    Disponibilidade, extensões e sugestões para{" "}
                    <span className="font-bold text-foreground">{cleanQuery}</span>
                  </>
                ) : (
                  "Digite um nome para pesquisar."
                )}
              </DialogDescription>
            </DialogHeader>

            {!loading && (
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border border-success/20 bg-success/10 px-3 py-2 text-success">
                  <strong className="block text-base">{availableCount}</strong> disponíveis
                </div>
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive">
                  <strong className="block text-base">{takenCount}</strong> ocupados
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-primary">
                  <strong className="block text-base">{suggestionCount}</strong> sugestões
                </div>
              </div>
            )}
          </div>

          <ScrollArea className="h-[min(66vh,620px)] bg-gradient-to-b from-card to-muted/30">
            <div className="px-5 sm:px-7 py-6">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-center py-4 gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />A verificar
                      disponibilidade em tempo real...
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="p-4 rounded-2xl border border-border bg-card shadow-sm"
                        >
                          <div className="flex items-start gap-3">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <div className="flex-1 space-y-3">
                              <Skeleton className="h-4 w-44" />
                              <Skeleton className="h-3 w-28" />
                              <Skeleton className="h-9 w-full rounded-xl" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {warning && (
                      <div className="flex items-start gap-2 rounded-2xl bg-warning/10 border border-warning/25 p-4 text-sm text-warning-foreground">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{warning}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Resultados com extensões populares e alternativas automáticas.
                      </div>
                      {showAlternatives ? (
                        <button
                          onClick={() => setShowAlternatives(false)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> Ver todos
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowAlternatives(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                        >
                          <SearchIcon className="h-3.5 w-3.5" /> Ver alternativas
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {visibleResults.map((r, i) => {
                        const isSuggestion =
                          r.available && (r.status === "suggestion" || r.suggested);
                        return (
                          <motion.div
                            key={`${r.domain}-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.025 }}
                            whileHover={{ y: -3 }}
                            className={`group relative overflow-hidden rounded-2xl bg-card border p-4 transition-all ${
                              r.available
                                ? "border-success/35 shadow-glow-success hover:shadow-glow-success"
                                : "border-destructive/20 hover:border-destructive/35"
                            }`}
                          >
                            {r.available && (
                              <div className="absolute inset-0 bg-success/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                            <div className="relative flex h-full flex-col gap-4">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`h-10 w-10 rounded-xl grid place-items-center shrink-0 ${
                                    r.available
                                      ? "bg-success/10 text-success"
                                      : "bg-destructive/10 text-destructive"
                                  }`}
                                >
                                  {r.available ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-foreground break-words">
                                    {r.domain}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {r.available ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">
                                        <Check className="h-3 w-3" /> {isSuggestion ? "Sugestão disponível" : "Disponível"}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-bold border border-destructive/20">
                                        <X className="h-3 w-3" /> Ocupado
                                      </span>
                                    )}
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-normal">
                                      {r.ext}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="relative mt-auto space-y-3">
                                {(() => {
                                  const key = periodFor(r.domain);
                                  const tier = tierFor(r, key);
                                  const tier1y = tierFor(r, "1y");
                                  const unavailable = !r.available || tier.price_final == null || tier.unavailable;
                                  const finalPrice = tier.price_final ?? 0;
                                  const yearly = unavailable ? 0 : finalPrice / tier.years;
                                  const savings =
                                    !unavailable && tier.years > 1 && tier1y.price_final != null
                                      ? Math.max(0, tier1y.price_final * tier.years - finalPrice)
                                      : 0;
                                  return (
                                    <>
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[10px] font-semibold text-muted-foreground mr-1">
                                          Período:
                                        </span>
                                        {PERIOD_OPTIONS.map((opt) => {
                                          const active = key === opt.key;
                                          return (
                                            <button
                                              key={opt.key}
                                              type="button"
                                              onClick={() =>
                                                setPeriodByDomain((p) => ({
                                                  ...p,
                                                  [r.domain]: opt.key,
                                                }))
                                              }
                                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                                                active
                                                  ? "border-primary bg-primary/15 text-primary"
                                                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                              }`}
                                            >
                                              {opt.label}
                                            </button>
                                          );
                                        })}
                                      </div>

                                      <div className="flex items-end justify-between gap-3">
                                        <div>
                                          <div className="text-[11px] text-muted-foreground">
                                            Total {tier.years === 1 ? "1 ano" : `${tier.years} anos`}
                                          </div>
                                          {unavailable ? (
                                            <div className="text-sm font-semibold text-warning leading-tight">
                                              {r.available ? "Preço indisponível temporariamente" : "Domínio ocupado"}
                                            </div>
                                          ) : (
                                            <>
                                              <div className="text-lg font-bold text-foreground leading-tight">
                                                {formatPrice(`R$ ${finalPrice.toFixed(2)}`, currency)}
                                              </div>
                                              {tier.price_hostinger != null && (
                                                <div className="text-[10px] text-muted-foreground line-through">
                                                   Hostinger {formatPrice(`R$ ${tier.price_hostinger.toFixed(2)}`, currency)}
                                                </div>
                                              )}
                                              <div className="text-[11px] text-muted-foreground">
                                                ≈ {formatPrice(`R$ ${yearly.toFixed(2)}`, currency)}/ano
                                                {savings > 0 && (
                                                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded bg-success/10 text-success font-semibold">
                                                    economize {formatPrice(`R$ ${savings.toFixed(2)}`, currency)}
                                                  </span>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>

                                        <button
                                          onClick={() => buy(r)}
                                          disabled={unavailable}
                                          className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                            unavailable
                                              ? "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                                              : r.available
                                                ? "bg-gradient-primary text-primary-foreground shadow-glow-soft hover:scale-[1.02]"
                                                : "bg-muted text-foreground hover:bg-muted/80 hover:scale-[1.02]"
                                          }`}
                                        >
                                          <ShoppingCart className="h-4 w-4" /> {unavailable ? "Bloqueado" : "Comprar"}
                                        </button>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {visibleResults.length === 0 && (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        Não foi possível consultar agora. Tente novamente.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
