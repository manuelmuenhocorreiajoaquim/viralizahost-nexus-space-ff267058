import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle,
  FileText,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createBoletoPayment, getPaymentStatus } from "@/lib/payments.functions";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string | null;
  customerEmail?: string;
  customerName?: string;
  onApproved: () => void;
};

type BoletoData = {
  paymentId: string;
  ticketUrl: string;
  barcode: string;
  amount: number;
  expiresAt: string;
};

function onlyDigits(v: string) {
  return v.replace(/\D+/g, "");
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

export default function BoletoPaymentDialog({
  open,
  onOpenChange,
  orderId,
  customerEmail,
  customerName,
  onApproved,
}: Props) {
  const createFn = useServerFn(createBoletoPayment);
  const statusFn = useServerFn(getPaymentStatus);

  const [doc, setDoc] = useState("");
  const [name, setName] = useState(customerName ?? "");
  const [email, setEmail] = useState(customerEmail ?? "");

  const [data, setData] = useState<BoletoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      setData(null);
      setError(null);
      setStatus("pending");
    }
  }, [open]);

  const submit = async () => {
    if (!orderId) return;
    setError(null);
    const docDigits = onlyDigits(doc);
    if (docDigits.length < 11) return setError("CPF/CNPJ inválido.");
    if (!name.trim() || !name.includes(" ")) return setError("Informe nome e sobrenome.");
    if (!email.includes("@")) return setError("Email inválido.");

    setLoading(true);
    try {
      const [first, ...rest] = name.trim().split(/\s+/);
      const last = rest.join(" ") || first;
      const res = await createFn({
        data: {
          orderId,
          payerEmail: email,
          payerFirstName: first,
          payerLastName: last,
          identification: {
            type: docDigits.length > 11 ? "CNPJ" : "CPF",
            number: docDigits,
          },
        },
      });
      if (!res.success || !res.ticketUrl) {
        throw new Error("Não foi possível gerar o boleto.");
      }
      setData({
        paymentId: res.paymentId,
        ticketUrl: res.ticketUrl,
        barcode: res.barcode || "",
        amount: Number(res.amount) || 0,
        expiresAt: res.expiresAt,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao gerar boleto.");
    } finally {
      setLoading(false);
    }
  };

  // Poll status while pending
  useEffect(() => {
    if (!data || status !== "pending") return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await statusFn({ data: { paymentId: data.paymentId } });
        if (cancelled) return;
        if (res.status === "approved") {
          setStatus("approved");
          onApproved();
          return;
        }
        if (res.status === "rejected" || res.status === "cancelled") {
          setStatus("rejected");
          return;
        }
      } catch {
        // ignore
      }
      pollRef.current = window.setTimeout(poll, 8000);
    };
    pollRef.current = window.setTimeout(poll, 8000);
    return () => {
      cancelled = true;
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, status]);

  const copy = async () => {
    if (!data?.barcode) return;
    try {
      await navigator.clipboard.writeText(data.barcode);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const checkNow = async () => {
    if (!data) return;
    setChecking(true);
    try {
      const res = await statusFn({ data: { paymentId: data.paymentId } });
      if (res.status === "approved") {
        setStatus("approved");
        onApproved();
      } else {
        toast.info("Pagamento ainda não compensado. Boletos podem levar até 2 dias úteis.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px] p-0 overflow-hidden border-white/60 bg-white/95 shadow-[0_34px_120px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
        <div className="relative overflow-hidden px-6 pt-6 pb-5 border-b border-slate-100 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/95 shadow-xl">
                <FileText className="h-6 w-6 text-slate-800" />
              </span>
              Boleto bancário
            </DialogTitle>
            <DialogDescription className="text-slate-200">
              Compensação em 1–2 dias úteis · Mercado Pago
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4 bg-gradient-to-b from-white to-slate-50">
          {status === "approved" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 grid place-items-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Boleto compensado!</h3>
            </motion.div>
          )}

          {!data && status !== "approved" && (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Nome completo</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome e sobrenome"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">CPF / CNPJ</label>
                <input
                  inputMode="numeric"
                  value={doc}
                  onChange={(e) => setDoc(formatCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
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
                className="w-full rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 py-3.5 text-sm font-black text-white shadow-[0_18px_45px_rgba(15,23,42,0.32)] disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Gerando boleto…
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4" /> Gerar Boleto
                  </>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="h-3 w-3" /> Processado por Mercado Pago
              </div>
            </>
          )}

          {data && status !== "approved" && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Valor</span>
                  <span className="font-black text-slate-900">
                    R$ {data.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Vence em</span>
                  <span className="font-mono">
                    {new Date(data.expiresAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>

              {data.barcode && (
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Código de barras
                  </label>
                  <div className="mt-1.5 flex gap-2">
                    <input
                      readOnly
                      value={data.barcode}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-mono bg-slate-50 text-slate-700 truncate outline-none"
                    />
                    <button
                      onClick={copy}
                      className="px-3 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-blue-800"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
              )}

              <a
                href={data.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-500 py-3.5 text-sm font-black text-white shadow-lg inline-flex items-center justify-center gap-2"
              >
                <ExternalLink className="h-4 w-4" /> Abrir boleto
              </a>

              <button
                onClick={checkNow}
                disabled={checking}
                className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 inline-flex items-center justify-center gap-2 hover:bg-blue-100 disabled:opacity-60"
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Já paguei, verificar agora
              </button>

              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600">
                Boletos podem levar até 2 dias úteis para serem compensados. Você receberá um email
                assim que o pagamento for confirmado.
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
