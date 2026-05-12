import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Globe, Check, X, ShoppingCart, ArrowRight, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCart } from "@/lib/cart";
import { registerDomainProduct } from "@/lib/catalog";
import { useCurrency, formatPrice } from "@/lib/currency";

type Tld = { ext: string; priceBRL: number };

const TLDS: Tld[] = [
  { ext: ".com", priceBRL: 59 },
  { ext: ".com.br", priceBRL: 49 },
  { ext: ".ao", priceBRL: 250 },
  { ext: ".co.ao", priceBRL: 350 },
  { ext: ".net", priceBRL: 69 },
  { ext: ".org", priceBRL: 69 },
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Mock availability — deterministic per query+ext. */
function mockAvailable(query: string, ext: string): boolean {
  const q = query.toLowerCase().trim();
  // Honor user's example exactly.
  if (q === "minhaempresa") {
    return !(ext === ".com.br" || ext === ".org");
  }
  return hash(q + ext) % 3 !== 0;
}

function sanitize(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\..*$/, "")
    .replace(/[^a-z0-9-]/g, "");
}

export type DomainResult = {
  domain: string;
  ext: string;
  priceBRL: number;
  available: boolean;
};

export default function DomainSearchDialog({
  open,
  onOpenChange,
  query,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  query: string;
}) {
  const cart = useCart();
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [showAlternatives, setShowAlternatives] = useState(false);

  const cleanQuery = useMemo(() => sanitize(query), [query]);

  const results: DomainResult[] = useMemo(() => {
    if (!cleanQuery) return [];
    return TLDS.map((t) => ({
      domain: `${cleanQuery}${t.ext}`,
      ext: t.ext,
      priceBRL: t.priceBRL,
      available: mockAvailable(cleanQuery, t.ext),
    }));
  }, [cleanQuery]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setShowAlternatives(false);
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, [open, query]);

  const buy = (r: DomainResult) => {
    registerDomainProduct(r.domain, r.priceBRL);
    cart.add(`domain:${r.domain}`);
    onOpenChange(false);
    navigate({ to: "/checkout", search: { step: "cart" } });
  };

  const visibleResults = showAlternatives
    ? results.filter((r) => r.available)
    : results;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border-slate-200 shadow-2xl p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Globe className="h-5 w-5 text-primary" />
              Pesquisa de domínio
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {cleanQuery ? (
                <>Resultados para <span className="font-semibold text-slate-700">{cleanQuery}</span></>
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
                className="py-16 flex flex-col items-center justify-center text-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse" />
                  <div className="relative h-16 w-16 rounded-full bg-gradient-primary grid place-items-center shadow-glow">
                    <Loader2 className="h-7 w-7 text-primary-foreground animate-spin" />
                  </div>
                </div>
                <p className="mt-6 text-base font-semibold text-slate-800">A verificar disponibilidade do domínio...</p>
                <p className="mt-1 text-sm text-slate-500">Consultando registros globais</p>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {showAlternatives && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-slate-500">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Mostrando apenas extensões disponíveis.
                    <button onClick={() => setShowAlternatives(false)} className="text-primary font-semibold hover:underline">
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
                    className="flex items-center gap-3 p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition shadow-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 truncate">{r.domain}</div>
                      <div className="mt-1 flex items-center gap-2">
                        {r.available ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            <Check className="h-3 w-3" /> Disponível
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-[11px] font-bold border border-red-200">
                            <X className="h-3 w-3" /> Ocupado
                          </span>
                        )}
                        {r.available && (
                          <span className="text-xs text-slate-500">
                            <span className="font-semibold text-slate-900">{formatPrice(`R$ ${r.priceBRL}`, currency)}</span>
                            <span className="text-slate-400">/ano</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {r.available ? (
                      <button
                        onClick={() => buy(r)}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow-soft hover:scale-[1.02] transition"
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
                {visibleResults.length === 0 && (
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
  );
}
