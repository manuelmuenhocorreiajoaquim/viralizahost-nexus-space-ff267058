import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/dashboard/ui";
import { Server, Plus, Loader2, CheckCircle2, XCircle, Pencil, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/servers")({
  component: Page,
});

type WhmServerRow = {
  id: string;
  name: string;
  hostname: string;
  api_url: string;
  username: string;
  server_ip: string | null;
  nameservers: unknown;
  nameserver1: string;
  nameserver2: string;
  active: boolean;
  max_accounts: number;
  current_accounts: number;
  notes: string | null;
  created_at: string;
};

type ServerForm = {
  id?: string;
  name: string;
  hostname: string;
  api_url: string;
  username: string;
  token: string;
  server_ip: string;
  nameserversText: string;
  active: boolean;
  max_accounts: number;
  notes: string;
};

const empty: ServerForm = {
  name: "",
  hostname: "",
  api_url: "",
  username: "",
  token: "",
  server_ip: "",
  nameserversText: "",
  active: true,
  max_accounts: 500,
  notes: "",
};

function Page() {
  const { user, isAdmin, loading, roleLoading, roles, hasRole } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ServerForm | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  useEffect(() => {
    console.info("[auth] admin servers guard", {
      userId: user?.id ?? null,
      loading,
      roleLoading,
      roles,
      detectedRole: roles[0] ?? null,
      isAdmin,
      hasAdminRole: hasRole("admin"),
      redirectReason: !loading && user && !isAdmin ? "authenticated_user_without_admin_role" : null,
    });
  }, [hasRole, isAdmin, loading, roleLoading, roles, user]);

  const { data: servers, isLoading } = useQuery({
    queryKey: ["whm_servers"],
    enabled: !!user && isAdmin && !roleLoading,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whm_servers")
        .select("id,name,hostname,api_url,username,server_ip,nameservers,nameserver1,nameserver2,active,max_accounts,current_accounts,notes,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as WhmServerRow[];
    },
  });

  const save = useMutation({
    mutationFn: async (form: ServerForm) => {
      const nameservers = form.nameserversText
        .split(/[\n,]+/)
        .map((value) => value.trim())
        .filter(Boolean);

      const { data, error } = await supabase.functions.invoke("save-whm-server", {
        body: {
          id: form.id,
          name: form.name,
          hostname: form.hostname,
          api_url: form.api_url,
          username: form.username,
          token: form.token,
          server_ip: form.server_ip,
          nameservers,
          active: form.active,
          max_accounts: form.max_accounts,
          notes: form.notes,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success("Servidor guardado com token protegido");
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
    else {
      toast.success(active ? "Servidor ativado" : "Servidor desativado");
      qc.invalidateQueries({ queryKey: ["whm_servers"] });
    }
  };

  const testConnection = async (id: string) => {
    setTestingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("whm-test-connection", {
        body: { server_id: id },
      });
      if (error) throw error;
      if (data?.ok) toast.success(`Conexão OK · WHM ${data.version ?? ""}`);
      else toast.error(`Falha: ${data?.error ?? "desconhecida"}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTestingId(null);
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Servidores WHM"
        subtitle="Gerencia os servidores cPanel/WHM usados para provisionamento. Tokens são protegidos no backend."
        actions={
          <button
            onClick={() => setEditing({ ...empty })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Adicionar servidor
          </button>
        }
      />

      {isLoading ? (
        <Card className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        </Card>
      ) : (servers?.length ?? 0) === 0 && !editing ? (
        <EmptyState
          icon={Server}
          title="Sem servidores configurados"
          description="Adicione o primeiro servidor WHM para começar a provisionar contas cPanel automaticamente."
        />
      ) : (
        <div className="grid gap-4">
          {servers?.map((s) => (
            <ServerCard
              key={s.id}
              server={s}
              testing={testingId === s.id}
              onTest={() => testConnection(s.id)}
              onToggle={() => toggleActive(s.id, !s.active)}
              onEdit={() => setEditing(formFromServer(s))}
              onRemove={() => {
                if (confirm(`Remover servidor ${s.name || s.hostname}?`)) remove.mutate(s.id);
              }}
            />
          ))}
        </div>
      )}

      {editing && (
        <ServerEditor
          form={editing}
          saving={save.isPending}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={() => save.mutate(editing)}
        />
      )}
    </div>
  );
}

function ServerCard({
  server,
  testing,
  onTest,
  onToggle,
  onEdit,
  onRemove,
}: {
  server: WhmServerRow;
  testing: boolean;
  onTest: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const nameservers = normalizeNameservers(server);

  return (
    <Card className="flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-[260px]">
        <div className="flex flex-wrap items-center gap-2">
          <div className="font-semibold">{server.name || server.hostname}</div>
          <StatusPill status={server.active ? "active" : "inactive"} />
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <KeyRound className="h-3 w-3" /> token protegido
          </span>
        </div>
        <div className="text-xs text-slate-500 mt-1">{server.api_url}</div>
        <div className="text-xs text-slate-500">Host: {server.hostname}</div>
        <div className="text-xs text-slate-500">NS: {nameservers.join(" · ") || "—"}</div>
        <div className="text-xs text-slate-500 mt-1">
          Contas: {server.current_accounts}/{server.max_accounts}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onTest}
          disabled={testing}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 inline-flex items-center gap-1.5 disabled:opacity-60"
        >
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          Testar
        </button>
        <button
          onClick={onToggle}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          {server.active ? <XCircle className="h-3.5 w-3.5 text-amber-600" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          {server.active ? "Desativar" : "Ativar"}
        </button>
        <button onClick={onEdit} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" aria-label="Editar servidor">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={onRemove} className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50" aria-label="Remover servidor">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}

function ServerEditor({
  form,
  saving,
  onChange,
  onCancel,
  onSave,
}: {
  form: ServerForm;
  saving: boolean;
  onChange: (form: ServerForm) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <Card className="mt-6">
      <h3 className="font-semibold mb-4">{form.id ? "Editar servidor" : "Novo servidor"}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome" value={form.name} onChange={(v) => onChange({ ...form, name: v })} placeholder="Servidor Angola 1" />
        <Field label="Hostname" value={form.hostname} onChange={(v) => onChange({ ...form, hostname: v })} placeholder="server1.viralizahost.com" />
        <Field label="API URL" value={form.api_url} onChange={(v) => onChange({ ...form, api_url: v })} placeholder="https://server1.viralizahost.com:2087" />
        <Field label="Username (root/reseller)" value={form.username} onChange={(v) => onChange({ ...form, username: v })} placeholder="root" />
        <Field label={form.id ? "Novo API Token (opcional)" : "API Token"} value={form.token} onChange={(v) => onChange({ ...form, token: v })} placeholder={form.id ? "Deixe vazio para manter" : "Cole o token WHM"} type="password" />
        <Field label="Server IP" value={form.server_ip} onChange={(v) => onChange({ ...form, server_ip: v })} placeholder="123.45.67.89" />
        <Field label="Max contas" value={String(form.max_accounts)} onChange={(v) => onChange({ ...form, max_accounts: parseInt(v) || 0 })} />
        <TextArea label="Nameservers" value={form.nameserversText} onChange={(v) => onChange({ ...form, nameserversText: v })} placeholder="ns1.viralizahost.com\nns2.viralizahost.com" />
        <Field label="Notas" value={form.notes} onChange={(v) => onChange({ ...form, notes: v })} className="sm:col-span-2" />
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={form.active} onChange={(e) => onChange({ ...form, active: e.target.checked })} />
          Ativo (disponível para provisionamento)
        </label>
      </div>
      <div className="flex items-center gap-2 mt-5">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 inline-flex items-center gap-2 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Guardar
        </button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50">
          Cancelar
        </button>
      </div>
    </Card>
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

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600 text-xs font-medium">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-600 focus:bg-white outline-none resize-none"
      />
    </label>
  );
}

function normalizeNameservers(server: Pick<WhmServerRow, "nameservers" | "nameserver1" | "nameserver2">) {
  if (Array.isArray(server.nameservers) && server.nameservers.length > 0) {
    return server.nameservers.map((ns) => String(ns)).filter(Boolean);
  }
  return [server.nameserver1, server.nameserver2].filter(Boolean);
}

function formFromServer(server: WhmServerRow): ServerForm {
  const nameservers = normalizeNameservers(server);
  return {
    id: server.id,
    name: server.name || server.hostname,
    hostname: server.hostname,
    api_url: server.api_url,
    username: server.username,
    token: "",
    server_ip: server.server_ip ?? "",
    nameserversText: nameservers.join("\n"),
    active: server.active,
    max_accounts: server.max_accounts,
    notes: server.notes ?? "",
  };
}
