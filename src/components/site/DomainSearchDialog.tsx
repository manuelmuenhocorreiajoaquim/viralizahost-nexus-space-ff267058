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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency, formatPrice } from "@/lib/currency";
import DomainCheckoutDialog, { type DomainCheckoutInfo } from "./DomainCheckoutDialog";

export type DomainResult = {
  domain: string;
  ext: string;
  priceBRL: number;
  available: boolean;
  source?: string;
};

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
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState<DomainCheckoutInfo | null>(null);

  const cleanQuery = useMemo(() => sanitize(query), [query]);

  useEffect(() => {
    if (!open || !cleanQuery) return;
    let cancelled = false;
    setLoading(true);
    setWarning(null);
    setResults([]);
    setShowAlternatives(false);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("domain-search", {
          body: { query: cleanQuery },
        });
        if (cancelled) return;
        if (error) throw error;
        setResults(data?.results ?? []);
        setWarning(data?.warning ?? null);
      } catch (e: any) {
        if (cancelled) return;
        setWarning(e?.message ?? "Erro ao consultar disponibilidade.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, cleanQuery]);

  const buy = (r: DomainResult) => {
    setCheckoutInfo({ domain: r.domain, ext: r.ext, priceBRL: r.priceBRL });
    setCheckoutOpen(true);
  };

  const visibleResults = showAlternatives
    ? results.filter((r) => r.available)
    : results;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl bg-white border-slate-200 shadow-2xl p-0 overflow-hidden">
          <div className="px-6 pt-6 pb-5 border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-slate-900">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center shadow-md">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                Resultados da pesquisa
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                {cleanQuery ? (
                  <>Mostrando opções para <span className="font-bold text-slate-800">{cleanQuery}</span></>
                ) : (
                  "Digite um nome para pesquisar."
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto bg-gradient-to-b from-white to-slate-50">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-center py-4 gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    A verificar disponibilidade...
                  </div>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-10 w-32 rounded-xl" />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {warning && (
                    <div className="mb-3 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{warning}</span>
                    </div>
                  )}

                  {showAlternatives && (
                    <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                      Mostrando apenas extensões disponíveis.
                      <button
                        onClick={() => setShowAlternatives(false)}
                        className="text-blue-600 font-semibold hover:underline"
                      >
                        Ver todas
                      </button>
                    </div>
                  )}

                  {visibleResults.map((r, i) => (
                    <motion.div
                      key={r.domain}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ y: -2 }}
                      className="group flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate flex items-center gap-2">
                          {r.domain}
                          {r.available && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                              <Check className="h-3 w-3" /> Disponível
                            </span>
                          )}
                          {!r.available && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[10px] font-bold border border-red-200">
                              <X className="h-3 w-3" /> Ocupado
                            </span>
                          )}
                        </div>
                        {r.available && (
                          <div className="mt-1 text-xs text-slate-500">
                            <span className="text-base font-bold text-slate-900">
                              {formatPrice(`R$ ${r.priceBRL}`, currency)}
                            </span>
                            <span className="text-slate-400">/ano</span>
                          </div>
                        )}
                      </div>
                      {r.available ? (
                        <button
                          onClick={() => buy(r)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.03] transition-all"
                        >
                          <ShoppingCart className="h-4 w-4" /> Comprar domínio
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowAlternatives(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition"
                        >
                          Ver alternativas <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </motion.div>
                  ))}

                  {visibleResults.length === 0 && !warning && (
                    <div className="py-10 text-center text-sm text-slate-500">
                      Nenhum resultado para mostrar.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      <DomainCheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        info={checkoutInfo}
      />
    </>
  );
}
