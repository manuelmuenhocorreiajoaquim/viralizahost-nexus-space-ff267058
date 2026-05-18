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
import { supabase } from "@/integrations/supabase/client";
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
  price_final: number;
  item_id: string | null;
};

export type DomainResult = {
  domain: string;
  ext: string;
  priceBRL: number;
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

function fallbackSuggestions(query: string): DomainResult[] {
  const base = sanitize(query);
  if (!base) return [];
  const variants = [
    base,
    `${base}angola`,
    `${base}brasil`,
    `${base}host`,
    `get${base}`,
    `use${base}`,
  ];
  const prices: Record<string, number> = {
    ".com": 59,
    ".net": 69,
    ".org": 69,
    ".com.br": 49,
    ".ao": 250,
    ".co.ao": 350,
    ".tech": 99,
    ".cloud": 129,
    ".store": 99,
  };
  const tlds = [".com", ".net", ".org", ".com.br", ".ao", ".co.ao", ".tech", ".cloud", ".store"];

  return Array.from(
    new Set(
      variants.flatMap((variant, index) => {
        const scope = index === 0 ? tlds : [".com", ".net", ".com.br", ".cloud"];
        return scope.map((ext) => `${variant}${ext}`);
      }),
    ),
  )
    .slice(0, 24)
    .map((domain) => {
      const ext = domain.endsWith(".com.br")
        ? ".com.br"
        : domain.endsWith(".co.ao")
          ? ".co.ao"
          : (domain.match(/\.[^.]+$/)?.[0] ?? ".com");
      return {
        domain,
        ext,
        priceBRL: prices[ext] ?? 79,
        available: false,
        status: "suggestion" as const,
        source: "fallback",
        suggested: true,
      };
    });
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
        if (hResults.length > 0) {
          setResults(hResults);
          setWarning(hres?.warning ?? null);
        } else {
          // Fallback to legacy edge function
          const { data, error } = await supabase.functions.invoke("domain-search", {
            body: { query: cleanQuery },
          });
          if (error) throw error;
          const nextResults = Array.isArray(data?.results) ? data.results : [];
          setResults(nextResults.length > 0 ? nextResults : fallbackSuggestions(cleanQuery));
          setWarning(data?.warning ?? null);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        console.error("[domain-search] failed", e);
        setResults(fallbackSuggestions(cleanQuery));
        setWarning("Não foi possível consultar o domínio. Mostrando sugestões alternativas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, cleanQuery]);

  const buy = (r: DomainResult) => {
    const annualPrice = Number(Number(r.priceBRL).toFixed(2));
    const product = registerDomainProduct(r.domain, annualPrice);
    add(product.id, {
      domain: r.domain,
      name: r.domain,
      type: "domain",
      priceBRL: annualPrice,
      billing: "annual",
      qty: 1,
    });
    setDomain(product.id, r.domain);
    // NÃO alterar o ciclo global aqui: o domínio é cobrado sempre anual
    // (billing: "annual"), mas outros itens (e-mail, hospedagem) devem manter
    // o ciclo escolhido pelo cliente.
    toast.success(`${r.domain} adicionado ao carrinho`);
    onOpenChange(false);
    navigate({ to: "/checkout", search: { step: "cart" } });
  };

  const availableCount = results.filter((r) => r.available).length;
  const takenCount = results.filter((r) => !r.available && r.status !== "suggestion").length;
  const suggestionCount = results.filter((r) => r.suggested || r.status === "suggestion").length;
  const visibleResults = showAlternatives
    ? results.filter((r) => r.available || r.suggested || r.status === "suggestion")
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
                          !r.available && (r.status === "suggestion" || r.suggested);
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
                                : isSuggestion
                                  ? "border-primary/20 hover:border-primary/40 hover:shadow-glow-soft"
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
                                      : isSuggestion
                                        ? "bg-primary/10 text-primary"
                                        : "bg-destructive/10 text-destructive"
                                  }`}
                                >
                                  {r.available ? (
                                    <Check className="h-5 w-5" />
                                  ) : isSuggestion ? (
                                    <Sparkles className="h-5 w-5" />
                                  ) : (
                                    <X className="h-5 w-5" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-foreground break-words">
                                    {r.domain}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2">
                                    {r.available ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20">
                                        <Check className="h-3 w-3" /> Disponível
                                      </span>
                                    ) : isSuggestion ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold border border-primary/20">
                                        <Sparkles className="h-3 w-3" /> Sugestão
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

                              <div className="relative mt-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                                <div>
                                  <div className="text-xs text-muted-foreground">Preço anual</div>
                                  <div className="text-lg font-bold text-foreground">
                                    {formatPrice(`R$ ${r.priceBRL}`, currency)}
                                    <span className="text-xs font-medium text-muted-foreground">
                                      /ano
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => buy(r)}
                                  className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] ${
                                    r.available
                                      ? "bg-gradient-primary text-primary-foreground shadow-glow-soft"
                                      : isSuggestion
                                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                                        : "bg-muted text-foreground hover:bg-muted/80"
                                  }`}
                                >
                                  <ShoppingCart className="h-4 w-4" /> Comprar domínio
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {visibleResults.length === 0 && (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        Não foi possível consultar o domínio. Tente pesquisar novamente.
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
