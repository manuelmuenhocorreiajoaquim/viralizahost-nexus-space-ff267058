import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Copy, CheckCircle2, Loader2, ShieldCheck, Clock, QrCode, RefreshCw, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createPixPayment, getPaymentStatus } from "@/lib/payments.functions";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string | null;
  customerEmail?: string;
  onApproved: () => void;
};

type PixData = {
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string;
  pixCopyPaste: string;
  expiresAt: string;
  amount: number;
};

function PixBrandIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path fill="#32BCAD" d="M32 6.8 57.2 32 32 57.2 6.8 32 32 6.8Z" />
      <path fill="#fff" d="M22.1 24.2c2.7-2.7 7.1-2.7 9.8 0l2.1 2.1 2.1-2.1c2.7-2.7 7.1-2.7 9.8 0l5.5 5.5-3.7 3.7-5.5-5.5a1.8 1.8 0 0 0-2.5 0l-3.9 3.9a2.6 2.6 0 0 1-3.6 0l-3.9-3.9a1.8 1.8 0 0 0-2.5 0l-5.5 5.5-3.7-3.7 5.5-5.5Zm-5.5 10.1 3.7-3.7 5.5 5.5a1.8 1.8 0 0 0 2.5 0l3.9-3.9a2.6 2.6 0 0 1 3.6 0l3.9 3.9a1.8 1.8 0 0 0 2.5 0l5.5-5.5 3.7 3.7-5.5 5.5c-2.7 2.7-7.1 2.7-9.8 0L34 37.7l-2.1 2.1c-2.7 2.7-7.1 2.7-9.8 0l-5.5-5.5Z" />
    </svg>
  );
}

export default function PixPaymentDialog({ open, onOpenChange, orderId, customerEmail, onApproved }: Props) {
  const createFn = useServerFn(createPixPayment);
  const statusFn = useServerFn(getPaymentStatus);

  const [pix, setPix] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "expired">("pending");
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef<number | null>(null);

  // Tick every second for countdown
  useEffect(() => {
    if (!open) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [open]);

  // Create PIX when dialog opens
  useEffect(() => {
    if (!open || !orderId) return;
    setError(null);
    setPix(null);
    setStatus("pending");
    setLoading(true);
    createFn({ data: { orderId, customerEmail, description: `Pedido ViralizaHost ${orderId.slice(0, 8)}` } })
      .then((res: any) => {
        console.log("payment response", res);
        if (!res?.success || !res?.paymentId) {
          setError("Não foi possível gerar o PIX. Verifique os dados e tente novamente.");
          return;
        }
        if (!res.qrCode && !res.qrCodeBase64 && !res.pixCopyPaste) {
          setError("PIX gerado mas sem QR Code. Tente novamente em instantes.");
          return;
        }
        setPix({
          paymentId: res.paymentId,
          qrCode: res.qrCode ?? "",
          qrCodeBase64: res.qrCodeBase64 ?? "",
          pixCopyPaste: res.copyPasteCode ?? res.pixCopyPaste ?? res.qrCode ?? "",
          expiresAt: res.expiresAt,
          amount: Number(res.amount) || 0,
        });
        if (res.status === "approved") {
          setStatus("approved");
          onApproved();
        }
      })
      .catch((e: any) => {
        console.error("[pix] createPixPayment error", e);
        const msg = typeof e?.message === "string" && e.message.length < 240
          ? e.message
          : "Não foi possível gerar o PIX. Verifique os dados e tente novamente.";
        setError(msg);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId, customerEmail]);

  // Poll status
  useEffect(() => {
    if (!pix || status !== "pending") return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res: any = await statusFn({ data: { paymentId: pix.paymentId } });
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
        if (res.status === "expired") {
          setStatus("expired");
          return;
        }
      } catch (e) {
        console.error("[pix] poll", e);
      }
      pollRef.current = window.setTimeout(poll, 4000);
    };
    pollRef.current = window.setTimeout(poll, 3500);
    return () => {
      cancelled = true;
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pix, status]);

  const remainingMs = useMemo(() => {
    if (!pix) return 0;
    return Math.max(0, new Date(pix.expiresAt).getTime() - now);
  }, [pix, now]);
  const mm = String(Math.floor(remainingMs / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0");

  useEffect(() => {
    if (pix && remainingMs === 0 && status === "pending") setStatus("expired");
  }, [remainingMs, pix, status]);

  const copy = async () => {
    if (!pix?.pixCopyPaste) return;
    try {
      await navigator.clipboard.writeText(pix.pixCopyPaste);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const checkNow = async () => {
    if (!pix?.paymentId) return;
    setChecking(true);
    try {
      const res: any = await statusFn({ data: { paymentId: pix.paymentId } });
      if (res?.status === "approved") {
        setStatus("approved");
        onApproved();
        return;
      }
      if (res?.status === "rejected" || res?.status === "cancelled") setStatus("rejected");
      else if (res?.status === "expired") setStatus("expired");
      else toast.info("Pagamento ainda não identificado. Vamos continuar verificando.");
    } catch (e) {
      console.error("[pix] manual check", e);
      toast.error("Não foi possível verificar agora.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] p-0 overflow-hidden border-white/60 bg-white/90 shadow-[0_34px_120px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
        <div className="relative overflow-hidden px-6 pt-6 pb-5 border-b border-slate-100 bg-gradient-to-br from-blue-950 via-blue-800 to-cyan-600 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(255,255,255,0.24),transparent_32%)]" />
          <DialogHeader>
            <DialogTitle className="relative flex items-center gap-3 text-white">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white shadow-xl"><PixBrandIcon className="h-7 w-7" /></span>
              Pague com PIX
            </DialogTitle>
            <DialogDescription className="relative text-blue-100">
              QR Code seguro · Aprovação automática Mercado Pago
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5 bg-gradient-to-b from-white to-slate-50">
          {loading && (
            <div className="py-12 grid place-items-center gap-4 text-slate-500">
              <div className="relative grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 ring-1 ring-blue-100">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <p className="text-sm font-semibold">A criar QR Code PIX seguro…</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {pix && status === "approved" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 grid place-items-center shadow-[0_18px_50px_rgba(16,185,129,0.22)]">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Pagamento aprovado!</h3>
              <p className="mt-1 text-sm text-slate-500">A ativar seus serviços…</p>
            </motion.div>
          )}

          {pix && (status === "pending" || status === "expired" || status === "rejected") && (
            <>
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 grid place-items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_18px_50px_rgba(15,23,42,0.10)]">
                {pix.qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${pix.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="h-64 w-64 object-contain"
                  />
                ) : (
                  <div className="h-64 w-64 grid place-items-center text-xs text-slate-400">QR indisponível</div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="h-4 w-4" />
                  {status === "expired" ? (
                    <span className="text-red-600 font-semibold">Expirado</span>
                  ) : status === "rejected" ? (
                    <span className="text-red-600 font-semibold">Recusado</span>
                  ) : (
                    <>
                      Expira em <span className="font-mono font-semibold text-slate-900">{mm}:{ss}</span>
                    </>
                  )}
                </div>
                <div className="text-slate-900 font-bold">
                  R$ {pix.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  PIX copia e cola
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    readOnly
                    value={pix.pixCopyPaste}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-mono bg-slate-50 text-slate-700 truncate outline-none"
                  />
                  <button
                    onClick={copy}
                    className="px-3 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-blue-800 transition shadow-[0_10px_26px_rgba(29,78,216,0.22)]"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>

              <button
                onClick={checkNow}
                disabled={checking || status !== "pending"}
                className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700 inline-flex items-center justify-center gap-2 transition hover:bg-blue-100 disabled:opacity-60"
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Já paguei, verificar agora
              </button>

              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600 space-y-1">
                <p><strong>1.</strong> Abra o app do seu banco.</p>
                <p><strong>2.</strong> Escolha pagar com PIX → ler QR Code ou colar código.</p>
                <p><strong>3.</strong> Confirme — a aprovação é automática.</p>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="h-3 w-3" /> Pagamento processado por Mercado Pago
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
