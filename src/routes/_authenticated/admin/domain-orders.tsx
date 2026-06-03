import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/ui";
import {
  adminListDomainOrders,
  adminUpdateDomainOrderStatus,
} from "@/lib/provisioning.functions";

export const Route = createFileRoute("/_authenticated/admin/domain-orders")({
  component: Page,
});

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "PENDENTE_ATIVACAO", label: "Pendentes" },
  { value: "AGUARDANDO_COMPRA_HOSTINGER", label: "Em compra na Hostinger" },
  { value: "ATIVO", label: "Ativos" },
  { value: "CANCELADO", label: "Cancelados" },
] as const;

function hostingerCheckoutUrl(domain: string) {
  // Abre o checkout de domínios da Hostinger pré-preenchido. O admin completa
  // a compra manualmente e volta para confirmar a ativação.
  return `https://www.hostinger.com/domain-checker?domain=${encodeURIComponent(domain)}`;
}

function statusBadge(s: string) {
  const v = (s ?? "").toUpperCase();
  if (v === "ATIVO")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Ativo
      </span>
    );
  if (v === "CANCELADO")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
        <XCircle className="h-3 w-3" /> Cancelado
      </span>
    );
  if (v === "AGUARDANDO_COMPRA_HOSTINGER")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-700">
        <Clock className="h-3 w-3" /> Em compra Hostinger
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-700">
      <Clock className="h-3 w-3" /> Pendente
    </span>
  );
}

function fmtCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(currency === "AKZ" ? "pt-AO" : "pt-BR", {
      style: "currency",
      currency: currency || "BRL",
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function Page() {
  const { user, isAdmin, loading, roleLoading } = useAuth();
  const qc = useQueryClient();
  const listFn = useServerFn(adminListDomainOrders);
  const updateFn = useServerFn(adminUpdateDomainOrderStatus);
  const [filter, setFilter] = useState<string>("PENDENTE_ATIVACAO");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-domain-orders", filter],
    enabled: !!user && isAdmin && !roleLoading,
    queryFn: () => listFn({ data: filter ? { status: filter } : {} }),
  });

  type Status = "ATIVO" | "CANCELADO" | "PENDENTE_ATIVACAO" | "AGUARDANDO_COMPRA_HOSTINGER";
  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; status: Status }) => updateFn({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(
        vars.status === "ATIVO"
          ? "Domínio ativado no painel do cliente."
          : vars.status === "CANCELADO"
            ? "Pedido cancelado."
            : vars.status === "AGUARDANDO_COMPRA_HOSTINGER"
              ? "Marcado como em compra na Hostinger."
              : "Status atualizado.",
      );
      qc.invalidateQueries({ queryKey: ["admin-domain-orders"] });
      qc.invalidateQueries({ queryKey: ["my-domain-orders"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar status"),
  });

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const orders = data?.orders ?? [];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="Pedidos de Domínio"
        subtitle="Compras de domínios aguardando ativação manual. Ative após registrar o domínio na Hostinger."
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
              filter === s.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-700 border-slate-200 hover:border-blue-400"
            }`}
          >
            {s.label}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Domínio</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Valor</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-right px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin inline-block" />
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            ) : (
              orders.map((o: any) => {
                const status = (o.status ?? "").toUpperCase();
                const isPending = status === "PENDENTE_ATIVACAO";
                const isAwaiting = status === "AGUARDANDO_COMPRA_HOSTINGER";
                const isActive = status === "ATIVO";
                const busy = busyId === o.id && updateMutation.isPending;
                return (
                  <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">{o.domain_name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="text-xs">{o.customer_email ?? "—"}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {o.user_id ? o.user_id.slice(0, 8) : "anon"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {fmtCurrency(Number(o.price ?? 0), o.currency ?? "BRL")}
                    </td>
                    <td className="px-4 py-3">{statusBadge(o.status)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {o.created_at ? new Date(o.created_at).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex flex-wrap gap-2 justify-end">
                        {(isPending || isAwaiting) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            disabled={busy}
                            onClick={() => {
                              window.open(hostingerCheckoutUrl(o.domain_name), "_blank", "noopener,noreferrer");
                              if (isPending) {
                                setBusyId(o.id);
                                updateMutation.mutate({ id: o.id, status: "AGUARDANDO_COMPRA_HOSTINGER" });
                              }
                            }}
                          >
                            Pagar domínio na Hostinger
                          </Button>
                        )}
                        {(isPending || isAwaiting) && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={busy}
                            onClick={() => {
                              setBusyId(o.id);
                              updateMutation.mutate({ id: o.id, status: "ATIVO" });
                            }}
                          >
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            )}
                            Confirmar Ativação
                          </Button>
                        )}
                        {(isPending || isAwaiting) && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                              if (!confirm("Cancelar este pedido de domínio?")) return;
                              setBusyId(o.id);
                              updateMutation.mutate({ id: o.id, status: "CANCELADO" });
                            }}
                          >
                            Cancelar
                          </Button>
                        )}
                        {isActive && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => {
                              setBusyId(o.id);
                              updateMutation.mutate({ id: o.id, status: "PENDENTE_ATIVACAO" });
                            }}
                          >
                            Reabrir
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
