import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, RefreshCw, CheckCircle2, AlertTriangle, Clock, FileSearch, X, Play } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/ui";
import { supabase } from "@/integrations/supabase/client";
import {
  adminListProvisioningJobs,
  adminRetryProvisioning,
  adminMarkProvisioned,
  adminGetJobLogs,
} from "@/lib/provisioning.functions";

export const Route = createFileRoute("/_authenticated/admin/provisioning")({
  component: Page,
});

const STATUSES = ["", "pending", "processing", "provisioned", "failed", "manual_review"] as const;

function statusBadge(s: string) {
  const base = "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold";
  switch (s) {
    case "provisioned":
      return <span className={`${base} bg-emerald-100 text-emerald-700`}><CheckCircle2 className="h-3 w-3" />Ativo</span>;
    case "failed":
      return <span className={`${base} bg-red-100 text-red-700`}><AlertTriangle className="h-3 w-3" />Falhou</span>;
    case "manual_review":
      return <span className={`${base} bg-amber-100 text-amber-700`}><AlertTriangle className="h-3 w-3" />Manual</span>;
    case "processing":
      return <span className={`${base} bg-blue-100 text-blue-700`}><Loader2 className="h-3 w-3 animate-spin" />Em curso</span>;
    default:
      return <span className={`${base} bg-slate-100 text-slate-700`}><Clock className="h-3 w-3" />Pendente</span>;
  }
}

function Page() {
  const { user, isAdmin, loading, roleLoading } = useAuth();
  const qc = useQueryClient();
  const listFn = useServerFn(adminListProvisioningJobs);
  const retryFn = useServerFn(adminRetryProvisioning);
  const markFn = useServerFn(adminMarkProvisioned);
  const logsFn = useServerFn(adminGetJobLogs);
  const [filter, setFilter] = useState<string>("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [logsFor, setLogsFor] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-provisioning", filter],
    enabled: !!user && isAdmin && !roleLoading,
    queryFn: () => listFn({ data: filter ? { status: filter } : {} }),
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["admin-job-logs", logsFor],
    enabled: !!logsFor,
    queryFn: () => logsFn({ data: { jobId: logsFor! } }),
  });

  // Realtime: refresh the list whenever provisioning_jobs changes.
  useEffect(() => {
    if (!user || !isAdmin) return;
    const channel = supabase
      .channel("admin-provisioning-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "provisioning_jobs" },
        (payload) => {
          qc.invalidateQueries({ queryKey: ["admin-provisioning"] });
          if (payload.eventType === "INSERT") {
            toast.info("Novo provisionamento na fila");
          } else if (payload.eventType === "UPDATE") {
            const status = (payload.new as any)?.status;
            if (status === "provisioned") toast.success("Provisionamento concluído");
            else if (status === "failed") toast.error("Erro ao provisionar");
            else if (status === "processing") toast.message("Provisionamento iniciado");
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, qc]);

  const retry = useMutation({
    mutationFn: (jobId: string) => retryFn({ data: { jobId } }),
    onSuccess: () => {
      toast.success("Reprocessado.");
      qc.invalidateQueries({ queryKey: ["admin-provisioning"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha."),
    onSettled: () => setBusyId(null),
  });

  const markDone = useMutation({
    mutationFn: (jobId: string) => markFn({ data: { jobId } }),
    onSuccess: () => {
      toast.success("Marcado como ativo.");
      qc.invalidateQueries({ queryKey: ["admin-provisioning"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha."),
    onSettled: () => setBusyId(null),
  });

  if (loading || roleLoading) {
    return <div className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const jobs = data?.jobs ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provisionamentos Hostinger"
        subtitle="Acompanhe a fila de ativação de serviços comprados no ViralizaHost."
      />

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((s) => (
          <button
            key={s || "all"}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              filter === s
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
            }`}
          >
            {s || "Todos"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" /></div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Nenhum job nesta vista.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Criado</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Resource ID</th>
                <th className="px-3 py-2">Erro</th>
                <th className="px-3 py-2">Tentativas</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j: any) => (
                <tr key={j.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-xs text-slate-500">{new Date(j.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 font-medium">{j.provider_service_type}</td>
                  <td className="px-3 py-2">{statusBadge(j.status)}</td>
                  <td className="px-3 py-2 text-xs font-mono">{j.order_id?.slice(0, 8)}…</td>
                  <td className="px-3 py-2 text-xs font-mono">{j.provider_resource_id ?? "—"}</td>
                  <td className="px-3 py-2 text-xs text-red-600 max-w-xs truncate" title={j.error_message ?? ""}>
                    {j.error_message ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">{j.attempts}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="default"
                      disabled={busyId === j.id}
                      onClick={() => { setBusyId(j.id); retry.mutate(j.id); }}
                    >
                      {j.attempts > 0 ? <RefreshCw className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                      {j.attempts > 0 ? "Reexecutar" : "Executar"}
                    </Button>
                    {j.status !== "provisioned" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-1"
                        disabled={busyId === j.id}
                        onClick={() => { setBusyId(j.id); markDone.mutate(j.id); }}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Ativar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-1"
                      onClick={() => setLogsFor(j.id)}
                    >
                      <FileSearch className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logsFor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setLogsFor(null)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">Logs Hostinger</h3>
              <button onClick={() => setLogsFor(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 overflow-auto text-xs font-mono space-y-3">
              {logsLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              {logs?.logs?.length === 0 && <p className="text-slate-500">Sem registos.</p>}
              {logs?.logs?.map((l: any) => (
                <div key={l.id} className="border rounded p-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{l.method} {l.endpoint}</span>
                    <span>{l.status_code} · {l.duration_ms}ms · {new Date(l.created_at).toLocaleTimeString()}</span>
                  </div>
                  {l.error_message && <div className="text-red-600 mt-1">{l.error_message}</div>}
                  <pre className="mt-1 text-[10px] whitespace-pre-wrap break-all text-slate-600">{JSON.stringify(l.response, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
