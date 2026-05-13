import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Copy, CheckCircle2, Loader2, ShieldCheck, Clock, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createPixPayment, getPaymentStatus } from "@/lib/payments.functions";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string | null;
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

export default function PixPaymentDialog({ open, onOpenChange, orderId, onApproved }: Props) {
  const createFn = useServerFn(createPixPayment);
  const statusFn = useServerFn(getPaymentStatus);

  const [pix, setPix] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "expired">("pending");
  const [copied, setCopied] = useState(false);
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
    createFn({ data: { orderId } })
      .then((res: any) => {
        setPix({
          paymentId: res.paymentId,
          qrCode: res.qrCode,
          qrCodeBase64: res.qrCodeBase64,
          pixCopyPaste: res.pixCopyPaste,
          expiresAt: res.expiresAt,
          amount: res.amount,
        });
        if (res.status === "approved") {
          setStatus("approved");
          onApproved();
        }
      })
      .catch((e: any) => {
        console.error(e);
        setError(e?.message ?? "Não foi possível gerar o PIX");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <QrCode className="h-5 w-5 text-emerald-600" /> Pague com PIX
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Aprovação imediata · Mercado Pago
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-4">
          {loading && (
            <div className="py-12 grid place-items-center gap-3 text-slate-500">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
              <p className="text-sm">A gerar QR Code seguro…</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
          )}

          {pix && status === "approved" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 grid place-items-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Pagamento aprovado!</h3>
              <p className="mt-1 text-sm text-slate-500">A ativar seus serviços…</p>
            </motion.div>
          )}

          {pix && (status === "pending" || status === "expired" || status === "rejected") && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 grid place-items-center">
                {pix.qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${pix.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="h-56 w-56 object-contain"
                  />
                ) : (
                  <div className="h-56 w-56 grid place-items-center text-xs text-slate-400">QR indisponível</div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm">
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
                    className="px-3 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold inline-flex items-center gap-1.5 hover:bg-slate-800 transition"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
              </div>

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
