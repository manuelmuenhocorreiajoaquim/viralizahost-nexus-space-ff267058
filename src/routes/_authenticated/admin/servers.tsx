import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/dashboard/ui";
import { Server, Plus, Loader2, CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/servers")({
  component: Page,
});

type ServerForm = {
  id?: string;
  hostname: string;
  api_url: string;
  username: string;
  token: string;
  server_ip: string;
  nameserver1: string;
  nameserver2: string;
  active: boolean;
  max_accounts: number;
  notes: string;
};

const empty: ServerForm = {
  hostname: "",
  api_url: "",
  username: "",
  token: "",
  server_ip: "",
  nameserver1: "",
  nameserver2: "",
  active: true,
  max_accounts: 500,
  notes: "",
};

function Page() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ServerForm | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const { data: servers, isLoading } = useQuery({
    queryKey: ["whm_servers"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whm_servers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (form: ServerForm) => {
      const payload = { ...form };
      if (form.id) {
        const { error } = await supabase
          .from("whm_servers")
          .update({
            hostname: payload.hostname,
            api_url: payload.api_url,
            username: payload.username,
            token: payload.token,
            server_ip: payload.server_ip || null,
            nameserver1: payload.nameserver1,
            nameserver2: payload.nameserver2,
            active: payload.active,
            max_accounts: payload.max_accounts,
            notes: payload.notes || null,
          })
          .eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("whm_servers").insert({
          hostname: payload.hostname,
          api_url: payload.api_url,
          username: payload.username,
          token: payload.token,
          server_ip: payload.server_ip || null,
          nameserver1: payload.nameserver1,
          nameserver2: payload.nameserver2,
          active: payload.active,
          max_accounts: payload.max_accounts,
          notes: payload.notes || null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Servidor guardado");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["whm_servers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("whm_servers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Servidor removido");
      qc.invalidateQueries({ queryKey: ["whm_servers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("whm_servers")
      .update({ active })
      .eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["whm_servers"] });
  };

  const testConnection = async (id: string) => {
    setTestingId(id);
    try {
      const { data, error } = await supabase.functions.invoke(
        "whm-test-connection",
        { body: { server_id: id } },
      );
      if (error) throw error;
      if (data?.ok) toast.success(`Conexão OK · WHM ${data.version ?? ""}`);
      else toast.error(`Falha: ${data?.error ?? "desconhecida"}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTestingId(null);
    }
  };

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Servidores WHM"
        subtitle="Gerencia os servidores cPanel/WHM usados para provisionamento."
        actions={
          <button
            onClick={() => setEditing({ ...empty })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Adicionar servidor
          </button>
        }
      />

      {!isLoading && (servers?.length ?? 0) === 0 && !editing ? (
        <EmptyState
          icon={Server}
          title="Sem servidores configurados"
          description="Adicione o primeiro servidor WHM para começar a provisionar contas cPanel automaticamente."
        />
      ) : (
        <div className="grid gap-4">
          {servers?.map((s) => (
            <Card key={s.id} className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{s.hostname}</div>
                  <StatusPill status={s.active ? "active" : "inactive"} />
                </div>
                <div className="text-xs text-slate-500 mt-1">{s.api_url}</div>
                <div className="text-xs text-slate-500">
                  NS: {s.nameserver1} · {s.nameserver2}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Contas: {s.current_accounts}/{s.max_accounts}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => testConnection(s.id)}
                  disabled={testingId === s.id}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  {testingId === s.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  Testar
                </button>
                <button
                  onClick={() => toggleActive(s.id, !s.active)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  {s.active ? (
                    <XCircle className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  )}
                  {s.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() =>
                    setEditing({
                      id: s.id,
                      hostname: s.hostname,
                      api_url: s.api_url,
                      username: s.username,
                      token: s.token,
                      server_ip: s.server_ip ?? "",
                      nameserver1: s.nameserver1,
                      nameserver2: s.nameserver2,
                      active: s.active,
                      max_accounts: s.max_accounts,
                      notes: s.notes ?? "",
                    })
                  }
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Remover servidor ${s.hostname}?`)) remove.mutate(s.id);
                  }}
                  className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <Card className="mt-6">
          <h3 className="font-semibold mb-4">
            {editing.id ? "Editar servidor" : "Novo servidor"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Hostname" value={editing.hostname} onChange={(v) => setEditing({ ...editing, hostname: v })} placeholder="server1.viralizahost.com" />
            <Field label="API URL" value={editing.api_url} onChange={(v) => setEditing({ ...editing, api_url: v })} placeholder="https://server1.viralizahost.com:2087" />
            <Field label="Username (root/reseller)" value={editing.username} onChange={(v) => setEditing({ ...editing, username: v })} placeholder="root" />
            <Field label="API Token" value={editing.token} onChange={(v) => setEditing({ ...editing, token: v })} placeholder="••••••••" type="password" />
            <Field label="Server IP" value={editing.server_ip} onChange={(v) => setEditing({ ...editing, server_ip: v })} placeholder="123.45.67.89" />
            <Field label="Max contas" value={String(editing.max_accounts)} onChange={(v) => setEditing({ ...editing, max_accounts: parseInt(v) || 0 })} />
            <Field label="Nameserver 1" value={editing.nameserver1} onChange={(v) => setEditing({ ...editing, nameserver1: v })} placeholder="ns1.viralizahost.com" />
            <Field label="Nameserver 2" value={editing.nameserver2} onChange={(v) => setEditing({ ...editing, nameserver2: v })} placeholder="ns2.viralizahost.com" />
            <Field label="Notas" value={editing.notes} onChange={(v) => setEditing({ ...editing, notes: v })} className="sm:col-span-2" />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Ativo (disponível para provisionamento)
            </label>
          </div>
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={() => save.mutate(editing)}
              disabled={save.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-50"
            >
              {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Guardar
            </button>
            <button
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="text-slate-600 text-xs font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white outline-none"
      />
    </label>
  );
}
