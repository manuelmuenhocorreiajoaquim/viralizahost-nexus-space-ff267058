import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Banknote, CheckCircle2, XCircle, ExternalLink, Loader2, Clock, FileText, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/ui";
import {
  adminListBankTransfers,
  adminApproveBankTransfer,
  adminRejectBankTransfer,
} from "@/lib/payments.functions";
import bicLogo from "@/assets/banco-bic-logo.png";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: Page,
});

function Page() {
  const { user, isAdmin, loading, roleLoading } = useAuth();
  const qc = useQueryClient();
  const listFn = useServerFn(adminListBankTransfers);
  const approveFn = useServerFn(adminApproveBankTransfer);
  const rejectFn = useServerFn(adminRejectBankTransfer);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-bank-transfers"],
    enabled: !!user && isAdmin && !roleLoading,
    queryFn: () => listFn(),
  });

  const approve = useMutation({
    mutationFn: (paymentId: string) => approveFn({ data: { paymentId } }),
    onSuccess: () => {
      toast.success("Pagamento aprovado.");
      qc.invalidateQueries({ queryKey: ["admin-bank-transfers"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao aprovar."),
    onSettled: () => setBusyId(null),
  });

  const reject = useMutation({
    mutationFn: (paymentId: string) => rejectFn({ data: { paymentId } }),
    onSuccess: () => {
      toast.success("Pagamento rejeitado.");
      qc.invalidateQueries({ queryKey: ["admin-bank-transfers"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao rejeitar."),
    onSettled: () => setBusyId(null),
  });

  if (loading || roleLoading) {
    return <div className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pagamentos Bancários"
        subtitle="Comprovativos de transferência via Banco BIC aguardando validação manual."
        icon={Banknote}
      />

      {isLoading ? (
        <div className="py-12 text-center text-slate-400"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
      ) : !data || data.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          <Banknote className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          Nenhum pagamento bancário registrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((p) => {
            const meta = p.metadata ?? {};
            const isPending = p.status === "in_process" || p.status === "pending";
            const isApproved = p.status === "approved";
            const isRejected = p.status === "rejected";
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                  <img src={bicLogo} alt="BIC" className="h-9 w-9 rounded-lg object-contain ring-1 ring-slate-200" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {p.customer.name ?? p.customer.email ?? "Cliente sem nome"}
                      </span>
                      {p.customer.email && (
                        <span className="text-xs text-slate-500">· {p.customer.email}</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pedido <code className="font-mono">{p.orderId?.slice(0, 8)}</code> · {new Date(p.createdAt).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <StatusPill status={p.status} pending={isPending} approved={isApproved} rejected={isRejected} />
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Valor</div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums">
                      R$ {Number(p.amount).toFixed(2)}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Comprovativo</div>
                    {meta.receipt_url ? (
                      <a
                        href={meta.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="truncate max-w-[260px]">{meta.receipt_name ?? "Abrir arquivo"}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <div className="mt-1 text-sm text-slate-400">— sem anexo</div>
                    )}
                    {meta.reference && (
                      <div className="mt-2 text-xs text-slate-600">
                        <span className="font-bold text-slate-500">Referência:</span> {meta.reference}
                      </div>
                    )}
                  </div>
                </div>

                {isPending && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                    <ShieldCheck className="h-4 w-4 text-slate-400" />
                    <span className="text-xs text-slate-500">Verifique o crédito no extrato antes de aprovar.</span>
                    <div className="ml-auto flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === p.id}
                        onClick={() => {
                          if (!confirm("Rejeitar este pagamento?")) return;
                          setBusyId(p.id);
                          reject.mutate(p.id);
                        }}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="mr-1 h-4 w-4" /> Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        disabled={busyId === p.id}
                        onClick={() => {
                          setBusyId(p.id);
                          approve.mutate(p.id);
                        }}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        {busyId === p.id ? (
                          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                        )}
                        Aprovar
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusPill({
  status,
  pending,
  approved,
  rejected,
}: {
  status: string;
  pending: boolean;
  approved: boolean;
  rejected: boolean;
}) {
  if (approved)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> Aprovado
      </span>
    );
  if (rejected)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700 ring-1 ring-red-200">
        <XCircle className="h-3 w-3" /> Rejeitado
      </span>
    );
  if (pending)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
        <Clock className="h-3 w-3" /> Aguardando validação
      </span>
    );
  return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{status}</span>;
}
