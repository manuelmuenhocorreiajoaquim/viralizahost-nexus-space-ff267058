import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  createPayPalOrder as createPayPalOrderFn,
  capturePayPalOrder as capturePayPalOrderFn,
  getPayPalConfig as getPayPalConfigFn,
} from "@/lib/payments.functions";

declare global {
  interface Window {
    paypal?: any;
  }
}

let sdkPromise: Promise<void> | null = null;
function loadPayPalSdk(clientId: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.paypal) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-paypal-sdk]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("PayPal SDK failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
    s.async = true;
    s.dataset.paypalSdk = "true";
    s.onload = () => resolve();
    s.onerror = () => {
      sdkPromise = null;
      reject(new Error("PayPal SDK failed to load"));
    };
    document.head.appendChild(s);
  });
  return sdkPromise;
}

export default function PayPalPaymentDialog({
  open,
  onOpenChange,
  orderId,
  onApproved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  onApproved: () => void;
}) {
  const createFn = useServerFn(createPayPalOrderFn);
  const captureFn = useServerFn(capturePayPalOrderFn);
  const configFn = useServerFn(getPayPalConfigFn);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<string>("sandbox");

  useEffect(() => {
    if (!open || !orderId) return;
    let cancelled = false;
    setLoading(true);
    setDone(false);
    setError(null);

    (async () => {
      try {
        const cfg = await configFn();
        if (cancelled) return;
        setMode(cfg.mode);
        await loadPayPalSdk(cfg.clientId);
        if (cancelled || !window.paypal || !containerRef.current) return;
        containerRef.current.innerHTML = "";

        window.paypal
          .Buttons({
            style: {
              layout: "vertical",
              color: "gold",
              shape: "rect",
              label: "paypal",
              height: 48,
            },
            createOrder: async () => {
              const res = await createFn({ data: { orderId } });
              if (!res?.providerOrderId) throw new Error("Falha ao criar ordem PayPal.");
              return res.providerOrderId;
            },
            onApprove: async (data: { orderID: string }) => {
              try {
                // We need our internal paymentId — re-create returns existing one.
                const reuse = await createFn({ data: { orderId } });
                const res = await captureFn({
                  data: {
                    paymentId: reuse.paymentId,
                    providerOrderId: data.orderID,
                  },
                });
                if (res.status === "approved") {
                  setDone(true);
                  toast.success("Pagamento PayPal aprovado!");
                  setTimeout(() => onApproved(), 800);
                } else {
                  setError(`Status: ${res.status}`);
                  toast.error(`Pagamento ${res.status}.`);
                }
              } catch (e: any) {
                setError(e?.message ?? "Erro ao capturar pagamento.");
                toast.error(e?.message ?? "Erro ao capturar pagamento PayPal.");
              }
            },
            onError: (err: any) => {
              console.error("[paypal] button error", err);
              setError("Erro no PayPal. Tente novamente.");
              toast.error("Erro no checkout PayPal.");
            },
            onCancel: () => {
              toast.message("Pagamento PayPal cancelado.");
            },
          })
          .render(containerRef.current);
      } catch (e: any) {
        if (!cancelled) {
          console.error("[paypal] init error", e);
          setError(e?.message ?? "Falha ao iniciar PayPal.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, orderId, configFn, createFn, captureFn, onApproved]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Pagar com PayPal
            {mode === "sandbox" && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 ring-1 ring-amber-200">
                Sandbox
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <div className="mt-3 text-lg font-bold text-slate-900">Pagamento aprovado!</div>
            <div className="text-sm text-slate-500">Estamos provisionando seu pedido…</div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Clique no botão PayPal abaixo para concluir o pagamento em uma janela segura.
            </p>

            {loading && (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando PayPal…
              </div>
            )}

            <div ref={containerRef} className="min-h-[60px]" />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" /> Pagamento processado pelo PayPal
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
