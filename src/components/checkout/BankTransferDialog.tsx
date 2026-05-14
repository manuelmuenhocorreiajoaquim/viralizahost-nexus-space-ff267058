import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, CheckCircle2, Upload, Loader2, Banknote, ShieldCheck, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { submitBankBicReceipt } from "@/lib/payments.functions";
import bicLogo from "@/assets/banco-bic-logo.png";

const BANK = {
  name: "Banco BIC",
  holder: "VIRALIZA FACIL ANGOLA, LDA",
  account: "A006.0051.0000.2477.5179.1014.1",
};

const ACCEPT = "image/png,image/jpeg,image/jpg,application/pdf";
const MAX_BYTES = 8 * 1024 * 1024;

export default function BankTransferDialog({
  open,
  onOpenChange,
  orderId,
  customerEmail,
  amount,
  onApproved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: string | null;
  customerEmail?: string;
  amount: number;
  onApproved: () => void;
}) {
  const submitFn = useServerFn(submitBankBicReceipt);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK.account);
      setCopied(true);
      toast.success("Conta copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const onPick = (f: File | null) => {
    if (!f) return setFile(null);
    if (f.size > MAX_BYTES) {
      toast.error("Arquivo muito grande (máx. 8 MB).");
      return;
    }
    if (!/^image\/(png|jpe?g)$|^application\/pdf$/.test(f.type)) {
      toast.error("Use PDF, PNG ou JPG.");
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!orderId) return;
    if (!file) {
      toast.error("Anexe o comprovativo da transferência.");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `${orderId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("bank-receipts")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("bank-receipts").getPublicUrl(path);

      await submitFn({
        data: {
          orderId,
          receiptUrl: pub.publicUrl,
          receiptName: file.name,
          reference: reference.trim() || undefined,
          payerEmail: customerEmail,
        },
      });

      setDone(true);
      toast.success("Comprovativo enviado!");
      setTimeout(() => onApproved(), 1500);
    } catch (e: any) {
      console.error("[bank-bic] submit", e);
      toast.error(e?.message ?? "Falha ao enviar comprovativo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-red-600" />
            Transferência Bancária — Banco BIC
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
            <div className="mt-3 text-lg font-bold text-slate-900">Comprovativo enviado!</div>
            <div className="text-sm text-slate-500">Pedido em <strong>aguardando validação</strong>. Você receberá um email após a aprovação.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bank card */}
            <div className="overflow-hidden rounded-2xl border border-red-200 bg-gradient-to-br from-red-600 via-red-500 to-rose-600 p-5 text-white shadow-[0_18px_40px_rgba(220,38,38,0.35)]">
              <div className="flex items-start gap-3">
                <img src={bicLogo} alt="Banco BIC" className="h-14 w-14 rounded-xl bg-white/10 p-1 ring-1 ring-white/30" />
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-widest opacity-80">Banco</div>
                  <div className="text-lg font-black">{BANK.name}</div>
                </div>
                <div className="rounded-lg bg-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                  Angola
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  <div className="text-[11px] uppercase tracking-widest opacity-75">Titular</div>
                  <div className="font-semibold">{BANK.holder}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-widest opacity-75">IBAN / Conta</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-md bg-white/15 px-2 py-1.5 font-mono text-[13px] tracking-tight">
                      {BANK.account}
                    </code>
                    <button
                      type="button"
                      onClick={copyAccount}
                      className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-50"
                    >
                      {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-sm">
                  <span className="opacity-80">Valor a transferir</span>
                  <span className="font-black tabular-nums">R$ {amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Upload */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Comprovativo (PDF, PNG ou JPG)
              </label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`flex w-full items-center gap-3 rounded-xl border-2 border-dashed p-4 text-left transition ${
                  file ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-white shadow-sm">
                  {file ? (
                    file.type === "application/pdf" ? <FileText className="h-5 w-5 text-emerald-600" /> : <ImageIcon className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Upload className="h-5 w-5 text-slate-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {file ? (
                    <>
                      <div className="truncate text-sm font-semibold text-slate-900">{file.name}</div>
                      <div className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(0)} KB · clique para trocar</div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-semibold text-slate-900">Anexar comprovativo</div>
                      <div className="text-[11px] text-slate-500">Arraste ou clique para selecionar (máx. 8 MB)</div>
                    </>
                  )}
                </div>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              />
            </div>

            {/* Reference */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600">
                Referência / observação (opcional)
              </label>
              <Textarea
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Transferência feita às 14:30 pelo Multicaixa Express"
                rows={2}
                maxLength={500}
              />
            </div>

            <Button
              onClick={submit}
              disabled={uploading || !file}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 py-6 text-base font-black text-white shadow-lg hover:from-red-700 hover:to-rose-700"
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando…</>
              ) : (
                <><CheckCircle2 className="mr-2 h-5 w-5" /> Já fiz a transferência</>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5" /> Após validação manual seu pedido será ativado.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
