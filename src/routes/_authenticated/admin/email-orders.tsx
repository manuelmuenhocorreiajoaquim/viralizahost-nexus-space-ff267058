import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/ui";
import { adminListEmailOrders, adminUpdateEmailOrder } from "@/lib/provisioning.functions";

export const Route = createFileRoute("/_authenticated/admin/email-orders")({
  component: Page,
});

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "PENDENTE_ATIVACAO", label: "Pendentes" },
  { value: "ATIVO", label: "Ativos" },
  { value: "CANCELADO", label: "Cancelados" },
];

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
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-700">
      <Clock className="h-3 w-3" /> Pendente
    </span>
  );
}

function Page() {
  const { user, isAdmin, loading, roleLoading } = useAuth();
  const qc = useQueryClient();
  const listFn = useServerFn(adminListEmailOrders);
  const updateFn = useServerFn(adminUpdateEmailOrder);
  const [filter, setFilter] = useState<string>("PENDENTE_ATIVACAO");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { webmail_url: string; cpanel_url: string; admin_notes: string }>>({});

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-email-orders", filter],
    enabled: !!user && isAdmin && !roleLoading,
    queryFn: () => listFn({ data: filter ? { status: filter } : {} }),
  });

  const mut = useMutation({
    mutationFn: updateFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-email-orders"] });
    },
  });

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!isAdmin) {
    return <div className="p-8 text-sm text-slate-600">Acesso restrito a administradores.</div>;
  }

  const orders = data?.orders ?? [];

  function getDraft(o: any) {
    return (
      drafts[o.id] ?? {
        webmail_url: o.webmail_url ?? "",
        cpanel_url: o.cpanel_url ?? "",
        admin_notes: o.admin_notes ?? "",
      }
    );
  }
  function setDraft(id: string, patch: Partial<{ webmail_url: string; cpanel_url: string; admin_notes: string }>) {
    setDrafts((d) => ({ ...d, [id]: { ...getDraft({ id, ...d[id] }), ...patch } }));
  }

  async function activate(o: any) {
    setBusyId(o.id);
    try {
      const draft = getDraft(o);
      await mut.mutateAsync({
        data: {
          id: o.id,
          status: "ATIVO",
          webmail_url: draft.webmail_url,
          cpanel_url: draft.cpanel_url,
          admin_notes: draft.admin_notes,
        },
      });
      toast.success("E-mail ativado");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao ativar");
    } finally {
      setBusyId(null);
    }
  }

  async function setStatus(o: any, status: "PENDENTE_ATIVACAO" | "CANCELADO") {
    setBusyId(o.id);
    try {
      await mut.mutateAsync({ data: { id: o.id, status } });
      toast.success("Status atualizado");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setBusyId(null);
    }
  }

  async function saveLinks(o: any) {
    setBusyId(o.id);
    try {
      const draft = getDraft(o);
      await mut.mutateAsync({
        data: {
          id: o.id,
          webmail_url: draft.webmail_url,
          cpanel_url: draft.cpanel_url,
          admin_notes: draft.admin_notes,
        },
      });
      toast.success("Dados salvos");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <PageHeader title="Ativar E-mail" subtitle="Crie a conta no cPanel/WHM, cole o link de acesso e ative o plano." />

      <div className="flex items-center gap-2 flex-wrap mb-4">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${filter === s.value ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 hover:border-blue-400"}`}
          >
            {s.label}
          </button>
        ))}
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching} className="ml-auto">
          <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} /> Atualizar
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-slate-500 py-10 text-center">Nenhum pedido neste filtro.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o: any) => {
            const d = getDraft(o);
            return (
              <div key={o.id} className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="font-semibold text-lg">{o.plan_name}</div>
                    <div className="text-xs text-slate-500">
                      {o.customer_email ?? o.user_id} · {o.domain || "sem domínio"} · {new Date(o.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge(o.status)}
                    <span className="text-sm font-semibold">{fmtCurrency(Number(o.price), o.currency)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                  <div><div className="text-xs text-slate-500">Contas</div><div className="font-semibold">{o.accounts_count}</div></div>
                  <div><div className="text-xs text-slate-500">Armazenamento</div><div className="font-semibold">{o.storage_gb} GB</div></div>
                  <div><div className="text-xs text-slate-500">Plano</div><div className="font-semibold">{o.plan_id}</div></div>
                  <div><div className="text-xs text-slate-500">Pedido</div><div className="font-mono text-[10px] truncate">{o.order_id ?? "—"}</div></div>
                </div>

                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  <label className="text-xs text-slate-600">
                    Link do Webmail (cliente)
                    <input
                      type="url"
                      placeholder="https://webmail.viralizahost.com"
                      value={d.webmail_url}
                      onChange={(e) => setDraft(o.id, { webmail_url: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                  </label>
                  <label className="text-xs text-slate-600">
                    Link do cPanel (interno, opcional)
                    <input
                      type="url"
                      placeholder="https://server.viralizahost.com:2083"
                      value={d.cpanel_url}
                      onChange={(e) => setDraft(o.id, { cpanel_url: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                  </label>
                  <label className="text-xs text-slate-600 md:col-span-2">
                    Observação interna
                    <textarea
                      rows={2}
                      value={d.admin_notes}
                      onChange={(e) => setDraft(o.id, { admin_notes: e.target.value })}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => saveLinks(o)} disabled={busyId === o.id}>
                    Salvar dados
                  </Button>
                  {o.status !== "ATIVO" && (
                    <Button size="sm" onClick={() => activate(o)} disabled={busyId === o.id} className="bg-emerald-600 hover:bg-emerald-700">
                      {busyId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ativar E-mail"}
                    </Button>
                  )}
                  {o.status !== "CANCELADO" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(o, "CANCELADO")} disabled={busyId === o.id}>
                      Cancelar
                    </Button>
                  )}
                  {o.status === "CANCELADO" && (
                    <Button size="sm" variant="outline" onClick={() => setStatus(o, "PENDENTE_ATIVACAO")} disabled={busyId === o.id}>
                      Reabrir
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
