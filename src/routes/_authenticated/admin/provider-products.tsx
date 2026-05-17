import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/ui";
import {
  adminListProviderProducts,
  adminUpsertProviderProduct,
  adminDeleteProviderProduct,
  adminHostingerCatalog,
  adminTestHostingerConnection,
  adminListHostingerVpsCatalog,
  adminMapCatalogItem,
} from "@/lib/provisioning.functions";

export const Route = createFileRoute("/_authenticated/admin/provider-products")({
  component: Page,
});

type FormState = {
  id?: string;
  internal_product_id: string;
  internal_product_name: string;
  provider: string;
  provider_service_type: "vps" | "domain" | "hosting" | "email" | "email_marketing" | "builder" | "vibecode";
  provider_price_id: string;
  auto_provision: boolean;
  internal_price: number;
  currency: string;
  active: boolean;
  notes: string;
};

const empty: FormState = {
  internal_product_id: "",
  internal_product_name: "",
  provider: "hostinger",
  provider_service_type: "vps",
  provider_price_id: "",
  auto_provision: false,
  internal_price: 0,
  currency: "BRL",
  active: true,
  notes: "",
};

function Page() {
  const { user, isAdmin, loading, roleLoading } = useAuth();
  const qc = useQueryClient();
  const listFn = useServerFn(adminListProviderProducts);
  const upsertFn = useServerFn(adminUpsertProviderProduct);
  const deleteFn = useServerFn(adminDeleteProviderProduct);
  const catalogFn = useServerFn(adminHostingerCatalog);
  const testFn = useServerFn(adminTestHostingerConnection);

  const [form, setForm] = useState<FormState | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-provider-products"],
    enabled: !!user && isAdmin && !roleLoading,
    queryFn: () => listFn(),
  });

  const catalogQuery = useQuery({
    queryKey: ["admin-hostinger-catalog"],
    enabled: !!user && isAdmin && !roleLoading,
    queryFn: () => catalogFn(),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const save = useMutation({
    mutationFn: (payload: FormState) =>
      upsertFn({
        data: {
          id: payload.id,
          internal_product_id: payload.internal_product_id,
          internal_product_name: payload.internal_product_name,
          provider: payload.provider,
          provider_service_type: payload.provider_service_type,
          provider_price_id: payload.provider_price_id || null,
          provider_metadata: {},
          auto_provision: payload.auto_provision,
          internal_price: payload.internal_price,
          currency: payload.currency,
          active: payload.active,
          notes: payload.notes || null,
        },
      }),
    onSuccess: () => {
      toast.success("Mapeamento guardado.");
      qc.invalidateQueries({ queryKey: ["admin-provider-products"] });
      setForm(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro a guardar."),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido.");
      qc.invalidateQueries({ queryKey: ["admin-provider-products"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro a remover."),
  });

  const test = useMutation({
    mutationFn: () => testFn(),
    onSuccess: (r: any) => {
      if (r?.ok) toast.success(r.message ?? "API Hostinger conectada.");
      else toast.error(r?.message ?? "API Hostinger indisponível.");
      qc.invalidateQueries({ queryKey: ["admin-hostinger-catalog"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao testar API."),
  });

  if (loading || roleLoading) {
    return <div className="p-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" /></div>;
  }
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const products = data?.products ?? [];
  const catalogOk = catalogQuery.data?.ok;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos Hostinger"
        subtitle="Mapeie cada produto do ViralizaHost ao item correspondente do catálogo Hostinger."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <div className="font-semibold mb-0.5">Conexão API Hostinger</div>
          <div className="text-xs text-slate-600">
            {test.isPending ? (
              <span className="text-slate-500">A testar GET /api/vps/v1/virtual-machines…</span>
            ) : test.data ? (
              test.data.ok ? (
                <span className="text-emerald-600 font-semibold">
                  ● API Hostinger conectada {test.data.sample ? `— ${test.data.sample}` : ""}
                </span>
              ) : (
                <span className="text-red-600 font-semibold">
                  ● {test.data.message} (kind: {test.data.kind}{test.data.status ? `, http ${test.data.status}` : ""})
                </span>
              )
            ) : catalogQuery.isLoading || catalogQuery.isFetching ? (
              <span className="text-slate-500">a testar GET /api/vps/v1/virtual-machines…</span>
            ) : catalogOk ? (
              <span className="text-emerald-600 font-semibold">🟢 API Hostinger conectada</span>
            ) : catalogQuery.data ? (
              <span className="text-red-600 font-semibold">
                ● {catalogQuery.data.error ?? `Erro HTTP ${catalogQuery.data.status || 0}`}
              </span>
            ) : (
              <span className="text-amber-600 font-semibold">● estado desconhecido — clique em “Testar API”</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => test.mutate()} disabled={test.isPending}>
            {test.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Testar API
          </Button>
          <Button size="sm" onClick={() => setForm(empty)}>
            <Plus className="h-4 w-4 mr-1" /> Novo mapeamento
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" /></div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
          Ainda sem mapeamentos.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Interno</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Hostinger price_id</th>
                <th className="px-3 py-2">Auto</th>
                <th className="px-3 py-2">Ativo</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-3 py-2">
                    <div className="font-medium">{p.internal_product_name}</div>
                    <div className="text-xs text-slate-500 font-mono">{p.internal_product_id}</div>
                  </td>
                  <td className="px-3 py-2">{p.provider_service_type}</td>
                  <td className="px-3 py-2 text-xs font-mono">{p.provider_price_id ?? "—"}</td>
                  <td className="px-3 py-2">{p.auto_provision ? "Sim" : "Manual"}</td>
                  <td className="px-3 py-2">{p.active ? "Sim" : "Não"}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => setForm({
                      id: p.id,
                      internal_product_id: p.internal_product_id,
                      internal_product_name: p.internal_product_name,
                      provider: p.provider,
                      provider_service_type: p.provider_service_type,
                      provider_price_id: p.provider_price_id ?? "",
                      auto_provision: p.auto_provision,
                      internal_price: Number(p.internal_price ?? 0),
                      currency: p.currency,
                      active: p.active,
                      notes: p.notes ?? "",
                    })}>Editar</Button>
                    <Button size="sm" variant="ghost" className="ml-1 text-red-600"
                      onClick={() => { if (confirm("Remover mapeamento?")) del.mutate(p.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setForm(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{form.id ? "Editar" : "Novo"} mapeamento</h3>
              <button onClick={() => setForm(null)}><X className="h-4 w-4" /></button>
            </div>

            <Field label="ID interno (slug do catálogo ViralizaHost)">
              <input className="w-full border rounded px-3 py-2 text-sm font-mono"
                value={form.internal_product_id}
                onChange={(e) => setForm({ ...form, internal_product_id: e.target.value })} />
            </Field>
            <Field label="Nome interno">
              <input className="w-full border rounded px-3 py-2 text-sm"
                value={form.internal_product_name}
                onChange={(e) => setForm({ ...form, internal_product_name: e.target.value })} />
            </Field>
            <Field label="Tipo de serviço Hostinger">
              <select className="w-full border rounded px-3 py-2 text-sm"
                value={form.provider_service_type}
                onChange={(e) => setForm({ ...form, provider_service_type: e.target.value as FormState["provider_service_type"] })}>
                <option value="vps">vps</option>
                <option value="domain">domain</option>
                <option value="hosting">hosting (manual)</option>
                <option value="email">email (manual)</option>
                <option value="email_marketing">email_marketing (manual)</option>
                <option value="builder">builder (manual)</option>
                <option value="vibecode">vibecode (manual)</option>
              </select>
            </Field>
            <Field label="Hostinger price_id (do catálogo)">
              <input className="w-full border rounded px-3 py-2 text-sm font-mono"
                placeholder="ex: vps-kvm2-12-eu"
                value={form.provider_price_id}
                onChange={(e) => setForm({ ...form, provider_price_id: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Preço interno">
                <input type="number" step="0.01" className="w-full border rounded px-3 py-2 text-sm"
                  value={form.internal_price}
                  onChange={(e) => setForm({ ...form, internal_price: Number(e.target.value) })} />
              </Field>
              <Field label="Moeda">
                <input className="w-full border rounded px-3 py-2 text-sm" value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </Field>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.auto_provision}
                  onChange={(e) => setForm({ ...form, auto_provision: e.target.checked })} />
                Ativação automática
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Ativo
              </label>
            </div>
            <Field label="Notas">
              <textarea className="w-full border rounded px-3 py-2 text-sm" rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setForm(null)}>Cancelar</Button>
              <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
                {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      {children}
    </label>
  );
}
