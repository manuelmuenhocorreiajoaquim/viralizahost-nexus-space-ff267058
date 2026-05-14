import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, ShieldCheck, AlertCircle, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createCardPayment, getMercadoPagoPublicKey } from "@/lib/payments.functions";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string | null;
  amount: number;
  customerEmail?: string;
  customerName?: string;
  onApproved: () => void;
};

// Minimal typing for the global MercadoPago SDK
type MPInstance = {
  createCardToken: (data: Record<string, string>) => Promise<{ id: string; first_six_digits?: string; last_four_digits?: string }>;
  getPaymentMethods: (opts: { bin: string }) => Promise<{ results: Array<{ id: string; payment_type_id: string; issuer?: { id?: string | number } }> }>;
  getInstallments?: (opts: { amount: string; bin: string }) => Promise<Array<{ payer_costs: Array<{ installments: number; recommended_message: string }> }>>;
};
declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, opts?: { locale?: string }) => MPInstance;
  }
}

let sdkPromise: Promise<void> | null = null;
function loadMpSdk(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.MercadoPago) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar Mercado Pago SDK"));
    document.head.appendChild(s);
  });
  return sdkPromise;
}

function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
}
function formatCardNumber(v: string) {
  return onlyDigits(v).slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}
function formatCpfCnpj(v: string) {
  const d = onlyDigits(v).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export default function CardPaymentDialog({
  open,
  onOpenChange,
  orderId,
  amount,
  customerEmail,
  customerName,
  onApproved,
}: Props) {
  const payFn = useServerFn(createCardPayment);
  const keyFn = useServerFn(getMercadoPagoPublicKey);
  const mpRef = useRef<MPInstance | null>(null);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [number, setNumber] = useState("");
  const [holder, setHolder] = useState(customerName ?? "");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [doc, setDoc] = useState("");
  const [installments, setInstallments] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState<Array<{ value: number; label: string }>>([
    { value: 1, label: "1x sem juros" },
  ]);

  // Init SDK + key when opened
  useEffect(() => {
    if (!open || !orderId) return;
    setError(null);
    setSuccess(false);
    setReady(false);
    (async () => {
      try {
        const { publicKey } = await keyFn();
        await loadMpSdk();
        if (!window.MercadoPago) throw new Error("SDK Mercado Pago indisponível");
        mpRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível inicializar o pagamento.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  // Lookup installments when bin is full enough
  useEffect(() => {
    const bin = onlyDigits(number).slice(0, 6);
    if (!ready || !mpRef.current || bin.length < 6 || amount <= 0) return;
    const mp = mpRef.current;
    let cancelled = false;
    (async () => {
      try {
        if (!mp.getInstallments) return;
        const list = await mp.getInstallments({ amount: amount.toFixed(2), bin });
        if (cancelled) return;
        const opts = list?.[0]?.payer_costs?.slice(0, 12).map((p) => ({
          value: p.installments,
          label: p.recommended_message,
        }));
        if (opts && opts.length) setInstallmentOptions(opts);
      } catch {
        // ignore — keep default 1x
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [number, ready, amount]);

  const expParts = useMemo(() => {
    const d = onlyDigits(exp).slice(0, 4);
    return { mm: d.slice(0, 2), yy: d.slice(2, 4) };
  }, [exp]);

  const submit = async () => {
    if (!orderId || !mpRef.current) return;
    setError(null);
    if (!number || number.replace(/\s/g, "").length < 13) return setError("Número de cartão inválido.");
    if (!holder.trim()) return setError("Informe o nome impresso no cartão.");
    if (!expParts.mm || !expParts.yy) return setError("Validade inválida (MM/AA).");
    if (cvv.length < 3) return setError("CVV inválido.");
    if (onlyDigits(doc).length < 11) return setError("CPF/CNPJ inválido.");

    setLoading(true);
    try {
      const cleanedNumber = onlyDigits(number);
      const docDigits = onlyDigits(doc);
      const idType = docDigits.length > 11 ? "CNPJ" : "CPF";
      const yearFull = `20${expParts.yy}`;
      const tokenRes = await mpRef.current.createCardToken({
        cardNumber: cleanedNumber,
        cardholderName: holder.trim(),
        cardExpirationMonth: expParts.mm,
        cardExpirationYear: yearFull,
        securityCode: cvv,
        identificationType: idType,
        identificationNumber: docDigits,
      });
      // Detect payment method id from BIN
      const pm = await mpRef.current.getPaymentMethods({ bin: cleanedNumber.slice(0, 6) });
      const pmId = pm?.results?.[0]?.id;
      if (!pmId) throw new Error("Cartão não suportado.");
      const issuerIdRaw = pm?.results?.[0]?.issuer?.id;
      const issuerId =
        typeof issuerIdRaw === "string"
          ? issuerIdRaw
          : typeof issuerIdRaw === "number"
            ? String(issuerIdRaw)
            : undefined;

      const res = await payFn({
        data: {
          orderId,
          cardToken: tokenRes.id,
          paymentMethodId: pmId,
          installments,
          issuerId,
          payerEmail: customerEmail || "cliente@viralizahost.com",
          payerName: holder.trim(),
          identification: { type: idType, number: docDigits },
        },
      });

      if (res.status === "approved") {
        setSuccess(true);
        toast.success("Pagamento aprovado!");
        setTimeout(() => onApproved(), 1200);
      } else if (res.status === "in_process" || res.status === "pending") {
        toast.info("Pagamento em análise. Avisaremos por email.");
        setTimeout(() => onApproved(), 1200);
      } else {
        setError(
          res.statusDetail
            ? `Pagamento recusado (${res.statusDetail}). Verifique os dados ou use outro cartão.`
            : "Pagamento recusado. Verifique os dados ou use outro cartão.",
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao processar o cartão.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] p-0 overflow-hidden border-white/60 bg-white/95 shadow-[0_34px_120px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
        <div className="relative overflow-hidden px-6 pt-6 pb-5 border-b border-slate-100 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/95 shadow-xl">
                <CreditCard className="h-6 w-6 text-blue-700" />
              </span>
              Pagamento com cartão
            </DialogTitle>
            <DialogDescription className="text-blue-100">
              Tokenização segura · Aprovação automática Mercado Pago
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4 bg-gradient-to-b from-white to-slate-50">
          {!ready && !error && (
            <div className="py-10 grid place-items-center text-slate-500">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              <p className="mt-3 text-sm font-semibold">Inicializando ambiente seguro…</p>
            </div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 grid place-items-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Pagamento aprovado!</h3>
            </motion.div>
          )}

          {ready && !success && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Número do cartão</label>
                <input
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={number}
                  onChange={(e) => setNumber(formatCardNumber(e.target.value))}
                  placeholder="0000 0000 0000 0000"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-sm tracking-wider outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Nome impresso no cartão</label>
                <input
                  autoComplete="cc-name"
                  value={holder}
                  onChange={(e) => setHolder(e.target.value.toUpperCase())}
                  placeholder="NOME COMO NO CARTÃO"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Validade</label>
                  <input
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={exp.length > 2 ? `${exp.slice(0, 2)}/${exp.slice(2)}` : exp}
                    onChange={(e) => setExp(onlyDigits(e.target.value).slice(0, 4))}
                    placeholder="MM/AA"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">CVV</label>
                  <input
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={cvv}
                    onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
                    placeholder="123"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">CPF / CNPJ do titular</label>
                <input
                  inputMode="numeric"
                  value={doc}
                  onChange={(e) => setDoc(formatCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Parcelas</label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                >
                  {installmentOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 py-3.5 text-sm font-black text-white shadow-[0_18px_45px_rgba(37,99,235,0.38)] transition hover:shadow-[0_22px_60px_rgba(37,99,235,0.48)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processando pagamento seguro…
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" /> Pagar R$ {" "}
                    {amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="h-3 w-3" /> Dados criptografados — processado por Mercado Pago
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
