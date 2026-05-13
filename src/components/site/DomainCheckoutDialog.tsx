import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, CreditCard, Loader2, Globe, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency, formatPrice } from "@/lib/currency";

export type DomainCheckoutInfo = {
  domain: string;
  ext: string;
  priceBRL: number;
};

export default function DomainCheckoutDialog({
  open,
  onOpenChange,
  info,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  info: DomainCheckoutInfo | null;
}) {
  const { currency } = useCurrency();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { id: string }>(null);
  const [error, setError] = useState<string | null>(null);

  const taxBRL = info ? Math.round(info.priceBRL * 0.05) : 0;
  const totalBRL = info ? info.priceBRL + taxBRL : 0;

  const submit = async () => {
    if (!info) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("domain-order-create", {
        body: {
          domain_name: info.domain,
          extension: info.ext,
          price: totalBRL,
          customer_email: email || null,
        },
      });
      if (error) throw error;
      setDone({ id: data.order.id });
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível criar a encomenda.");
    } finally {
      setLoading(false);
    }
  };

  const close = (v: boolean) => {
    if (loading) return;
    onOpenChange(v);
    if (!v) {
      setTimeout(() => {
        setDone(null);
        setError(null);
        setEmail("");
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg bg-white border-slate-200 shadow-2xl p-0 overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-br from-blue-50 to-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Finalizar registo de domínio
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Confirme os dados e prossiga para o pagamento.
            </DialogDescription>
          </DialogHeader>
        </div>

        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-10 text-center"
          >
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 grid place-items-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">Encomenda criada</h3>
            <p className="mt-1 text-sm text-slate-500">
              Guardamos a sua intenção de compra. Em breve enviaremos as instruções de pagamento.
            </p>
            <p className="mt-3 text-xs text-slate-400">Ref: {done.id}</p>
            <button
              onClick={() => close(false)}
              className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
            >
              Fechar
            </button>
          </motion.div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {info && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Globe className="h-4 w-4 text-blue-600" /> Domínio selecionado
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">{info.domain}</div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <Row label={`Registo ${info.ext} (1 ano)`} value={formatPrice(`R$ ${info.priceBRL}`, currency)} />
                  <Row label="Taxa de processamento" value={formatPrice(`R$ ${taxBRL}`, currency)} muted />
                  <div className="border-t border-slate-200 my-2" />
                  <Row
                    label={<span className="font-bold text-slate-900">Total</span>}
                    value={<span className="font-bold text-slate-900">{formatPrice(`R$ ${totalBRL}`, currency)}</span>}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                E-mail (opcional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Para receber o link de pagamento e o comprovativo.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01] transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              {loading ? "A processar..." : "Continuar pagamento"}
            </button>

            <p className="text-center text-xs text-slate-400">
              Pagamento via PIX, cartão ou PayPal — em breve.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, muted }: { label: React.ReactNode; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-slate-500" : "text-slate-700"}>{label}</span>
      <span className={muted ? "text-slate-500" : "text-slate-900"}>{value}</span>
    </div>
  );
}
