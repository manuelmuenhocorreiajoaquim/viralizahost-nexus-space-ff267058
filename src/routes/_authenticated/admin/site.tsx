import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Save, Trash2, ExternalLink, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/dashboard/ui";
import {
  adminListServicePlans,
  adminUpsertServicePlan,
  adminDeleteServicePlan,
  adminListSiteSections,
  adminUpsertSiteSection,
  adminDeleteSiteSection,
  adminListSiteImages,
  adminUpsertSiteImage,
  adminDeleteSiteImage,
  adminListSiteContents,
  adminUpsertSiteContent,
  adminDeleteSiteContent,
  adminListSiteSettings,
  adminUpsertSiteSetting,
  adminListDomainExtensions,
  adminUpsertDomainExtension,
  adminDeleteDomainExtension,
} from "@/lib/cms.functions";


export const Route = createFileRoute("/_authenticated/admin/site")({
  component: Page,
});

const CATEGORIES = [
  { value: "hosting", label: "Hospedagem" },
  { value: "email", label: "E-mail" },
  { value: "domain", label: "Domínios" },
  { value: "vps", label: "VPS & Cloud" },
  { value: "ai", label: "IA & Automação" },
  { value: "marketing", label: "Marketing" },
  { value: "design", label: "Design" },
  { value: "audiovisual", label: "Audiovisual" },
];

function Page() {
  const { isAdmin, loading, roleLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("prices");

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!isAdmin) {
    return <div className="p-8 text-center text-slate-600">Acesso restrito a administradores.</div>;
  }

  const q = query.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader title="Gestão do Site" subtitle="Edite preços, serviços, conteúdos e imagens do site público." />
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 text-sm hover:bg-slate-50"
        >
          <ExternalLink className="h-4 w-4" /> Pré-visualizar site
        </a>
      </div>

      <div className="relative">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar preços, serviços, domínios, conteúdos..."
          className="pl-9 pr-24 h-10"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-600 hover:bg-slate-100"
          >
            <X className="h-3 w-3" /> Limpar
          </button>
        )}
      </div>

      {q && <CrossTabResults query={q} currentTab={tab} onJump={setTab} />}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="prices">Preços</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="domains">Domínios</TabsTrigger>
          <TabsTrigger value="contents">Conteúdos</TabsTrigger>
          <TabsTrigger value="images">Imagens</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="prices"><PricesTab query={q} /></TabsContent>
        <TabsContent value="services"><ServicesTab query={q} /></TabsContent>
        <TabsContent value="domains"><DomainsTab query={q} /></TabsContent>
        <TabsContent value="contents"><ContentsTab query={q} /></TabsContent>
        <TabsContent value="images"><ImagesTab query={q} /></TabsContent>
        <TabsContent value="settings"><SettingsTab query={q} /></TabsContent>
      </Tabs>

    </div>
  );
}

// ============ Global search helpers ============

function norm(s: any): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Matches a query against any nested value (strings, numbers, arrays, booleans). */
function matchesQuery(item: any, q: string): boolean {
  if (!q) return true;
  const needle = norm(q);
  const walk = (v: any): boolean => {
    if (v == null) return false;
    if (typeof v === "string" || typeof v === "number") return norm(v).includes(needle);
    if (typeof v === "boolean") {
      const map = v ? ["sim", "ativo", "destaque", "true"] : ["nao", "inativo", "false"];
      return map.some((s) => s.includes(needle));
    }
    if (Array.isArray(v)) return v.some(walk);
    if (typeof v === "object") return Object.values(v).some(walk);
    return false;
  };
  // currency aliases
  if (["brl", "real", "reais"].some((s) => needle.includes(s)) && item?.price_brl != null) return true;
  if (["aoa", "akz", "kwanza"].some((s) => needle.includes(s)) && item?.price_aoa != null) return true;
  return walk(item);
}

const TAB_LABELS: Record<string, string> = {
  prices: "Preços",
  services: "Serviços",
  domains: "Domínios",
  contents: "Conteúdos",
  images: "Imagens",
  settings: "Configurações",
};

function CrossTabResults({
  query,
  currentTab,
  onJump,
}: {
  query: string;
  currentTab: string;
  onJump: (t: string) => void;
}) {
  const plansFn = useServerFn(adminListServicePlans);
  const sectionsFn = useServerFn(adminListSiteSections);
  const contentsFn = useServerFn(adminListSiteContents);
  const imagesFn = useServerFn(adminListSiteImages);
  const settingsFn = useServerFn(adminListSiteSettings);
  const domainsFn = useServerFn(adminListDomainExtensions);

  const { data: plans = [] } = useQuery({ queryKey: ["admin-service-plans"], queryFn: () => plansFn() });
  const { data: sections = [] } = useQuery({ queryKey: ["admin-site-sections"], queryFn: () => sectionsFn() });
  const { data: contents = [] } = useQuery({ queryKey: ["admin-site-contents"], queryFn: () => contentsFn() });
  const { data: images = [] } = useQuery({ queryKey: ["admin-site-images"], queryFn: () => imagesFn() });
  const { data: settings = [] } = useQuery({ queryKey: ["admin-site-settings"], queryFn: () => settingsFn() });
  const { data: domains = [] } = useQuery({ queryKey: ["admin-domain-extensions"], queryFn: () => domainsFn() });

  const counts: Array<{ tab: string; count: number }> = [
    { tab: "prices", count: (plans as any[]).filter((x) => matchesQuery(x, query)).length },
    { tab: "services", count: (plans as any[]).filter((x) => matchesQuery(x, query)).length },
    { tab: "domains", count: (domains as any[]).filter((x) => matchesQuery(x, query)).length },
    {
      tab: "contents",
      count:
        (sections as any[]).filter((x) => matchesQuery(x, query)).length +
        (contents as any[]).filter((x) => matchesQuery(x, query)).length,
    },
    { tab: "images", count: (images as any[]).filter((x) => matchesQuery(x, query)).length },
    { tab: "settings", count: (settings as any[]).filter((x) => matchesQuery(x, query)).length },
  ];

  const total = counts.reduce((s, c) => s + c.count, 0);
  if (total === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm px-4 py-2">
        Nenhum resultado encontrado.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-slate-500">Encontrado em:</span>
      {counts
        .filter((c) => c.count > 0)
        .map((c) => (
          <button
            key={c.tab}
            type="button"
            onClick={() => onJump(c.tab)}
            className={`px-2 py-1 rounded-full border transition ${
              c.tab === currentTab
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {TAB_LABELS[c.tab]} ({c.count})
          </button>
        ))}
    </div>
  );
}

// ============ PRICES (quick inline edit) ============

function PricesTab({ query = "" }: { query?: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListServicePlans);
  const upsertFn = useServerFn(adminUpsertServicePlan);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["admin-service-plans"],
    queryFn: () => listFn(),
  });

  const upsert = useMutation({
    mutationFn: (p: any) => upsertFn({ data: p }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-service-plans"] });
      toast.success("Preço atualizado");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  if (isLoading) return <Loader />;

  const filteredPlans = (plans as any[]).filter((p) => matchesQuery(p, query));
  const grouped = CATEGORIES.map((c) => ({
    ...c,
    items: filteredPlans.filter((p) => p.category === c.value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6 mt-4">
      {grouped.map((g) => (
        <div key={g.value} className="rounded-lg border border-slate-200 bg-white">
          <div className="px-4 py-3 border-b border-slate-200 font-semibold">{g.label}</div>
          <div className="divide-y divide-slate-100">
            {g.items.map((p: any) => (
              <PriceRow key={p.id} plan={p} onSave={(updated) => upsert.mutate(updated)} />
            ))}
          </div>
        </div>
      ))}
      {grouped.length === 0 && (
        <p className="text-sm text-slate-500">
          Nenhum plano cadastrado ainda. Use a aba <strong>Serviços</strong> para criar.
        </p>
      )}
    </div>
  );
}

function PriceRow({ plan, onSave }: { plan: any; onSave: (p: any) => void }) {
  const [brl, setBrl] = useState<string>(plan.price_brl ?? "");
  const [aoa, setAoa] = useState<string>(plan.price_aoa ?? "");
  const [active, setActive] = useState<boolean>(plan.is_active);
  const [featured, setFeatured] = useState<boolean>(plan.is_featured);

  const dirty =
    String(plan.price_brl ?? "") !== brl ||
    String(plan.price_aoa ?? "") !== aoa ||
    plan.is_active !== active ||
    plan.is_featured !== featured;

  return (
    <div className="px-4 py-3 grid grid-cols-1 md:grid-cols-[1fr_120px_120px_auto_auto_auto] gap-3 items-center">
      <div>
        <div className="font-medium">{plan.name}</div>
        <div className="text-xs text-slate-500">{plan.slug}</div>
      </div>
      <div>
        <Label className="text-[10px] text-slate-500">BRL</Label>
        <Input type="number" step="0.01" value={brl} onChange={(e) => setBrl(e.target.value)} />
      </div>
      <div>
        <Label className="text-[10px] text-slate-500">AOA</Label>
        <Input type="number" step="0.01" value={aoa} onChange={(e) => setAoa(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-xs">
        <Switch checked={active} onCheckedChange={setActive} /> Ativo
      </label>
      <label className="flex items-center gap-2 text-xs">
        <Switch checked={featured} onCheckedChange={setFeatured} /> Destaque
      </label>
      <Button
        size="sm"
        disabled={!dirty}
        onClick={() =>
          onSave({
            ...plan,
            price_brl: brl === "" ? null : Number(brl),
            price_aoa: aoa === "" ? null : Number(aoa),
            benefits: Array.isArray(plan.benefits) ? plan.benefits : [],
            is_active: active,
            is_featured: featured,
          })
        }
      >
        <Save className="h-3.5 w-3.5 mr-1" /> Salvar
      </Button>
    </div>
  );
}

// ============ SERVICES (full CRUD) ============

function emptyPlan() {
  return {
    slug: "",
    category: "hosting",
    name: "",
    short_description: "",
    benefits: [] as string[],
    cta_label: "Contratar",
    cta_href: "",
    price_brl: null as number | null,
    price_aoa: null as number | null,
    currency_default: "BRL",
    is_active: true,
    is_featured: false,
    badge: "",
    sort_order: 0,
  };
}

function ServicesTab({ query = "" }: { query?: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListServicePlans);
  const upsertFn = useServerFn(adminUpsertServicePlan);
  const deleteFn = useServerFn(adminDeleteServicePlan);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["admin-service-plans"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<any | null>(null);

  const upsert = useMutation({
    mutationFn: (p: any) => upsertFn({ data: p }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-service-plans"] });
      toast.success("Plano salvo");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-service-plans"] });
      toast.success("Plano removido");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover"),
  });

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4 mt-4">
      <Button onClick={() => setEditing(emptyPlan())}>
        <Plus className="h-4 w-4 mr-1" /> Novo serviço
      </Button>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-2">Nome</th>
              <th className="text-left p-2">Categoria</th>
              <th className="text-left p-2">BRL</th>
              <th className="text-left p-2">AOA</th>
              <th className="text-left p-2">Ativo</th>
              <th className="text-left p-2">Destaque</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {(plans as any[]).filter((p) => matchesQuery(p, query)).map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.slug}</div>
                </td>
                <td className="p-2">{p.category}</td>
                <td className="p-2">{p.price_brl ?? "-"}</td>
                <td className="p-2">{p.price_aoa ?? "-"}</td>
                <td className="p-2">{p.is_active ? "Sim" : "Não"}</td>
                <td className="p-2">{p.is_featured ? "Sim" : "Não"}</td>
                <td className="p-2 text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 text-red-600"
                    onClick={() => {
                      if (confirm(`Remover ${p.name}?`)) del.mutate(p.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {(plans as any[]).length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  Sem planos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <PlanDialog
          plan={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => upsert.mutate(p)}
          saving={upsert.isPending}
        />
      )}
    </div>
  );
}

function PlanDialog({
  plan,
  onClose,
  onSave,
  saving,
}: {
  plan: any;
  onClose: () => void;
  onSave: (p: any) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<any>({
    ...plan,
    benefits: Array.isArray(plan.benefits) ? plan.benefits.join("\n") : "",
  });

  function set<K extends string>(k: K, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }));
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan.id ? "Editar serviço" : "Novo serviço"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Slug *</Label>
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          </div>
          <div>
            <Label>Categoria *</Label>
            <select
              className="w-full border rounded h-9 px-2 text-sm"
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Descrição curta</Label>
            <Input
              value={form.short_description ?? ""}
              onChange={(e) => set("short_description", e.target.value)}
            />
          </div>
          <div>
            <Label>Preço BRL</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price_brl ?? ""}
              onChange={(e) => set("price_brl", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Preço AOA</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price_aoa ?? ""}
              onChange={(e) => set("price_aoa", e.target.value === "" ? null : Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Texto do botão</Label>
            <Input value={form.cta_label ?? ""} onChange={(e) => set("cta_label", e.target.value)} />
          </div>
          <div>
            <Label>Link do botão</Label>
            <Input value={form.cta_href ?? ""} onChange={(e) => set("cta_href", e.target.value)} />
          </div>
          <div>
            <Label>Badge</Label>
            <Input value={form.badge ?? ""} onChange={(e) => set("badge", e.target.value)} />
          </div>
          <div>
            <Label>Ordem</Label>
            <Input
              type="number"
              value={form.sort_order ?? 0}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </div>
          <div className="md:col-span-2">
            <Label>Benefícios (um por linha)</Label>
            <Textarea
              rows={6}
              value={form.benefits}
              onChange={(e) => set("benefits", e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} /> Ativo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.is_featured} onCheckedChange={(v) => set("is_featured", v)} /> Destaque
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={saving}
            onClick={() =>
              onSave({
                ...form,
                benefits: String(form.benefits || "")
                  .split("\n")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
              })
            }
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ CONTENTS (sections + key-value) ============

function ContentsTab({ query = "" }: { query?: string }) {
  const qc = useQueryClient();
  const sectionsFn = useServerFn(adminListSiteSections);
  const upsertSectionFn = useServerFn(adminUpsertSiteSection);
  const delSectionFn = useServerFn(adminDeleteSiteSection);
  const contentsFn = useServerFn(adminListSiteContents);
  const upsertContentFn = useServerFn(adminUpsertSiteContent);
  const delContentFn = useServerFn(adminDeleteSiteContent);

  const { data: sections = [], isLoading: l1 } = useQuery({
    queryKey: ["admin-site-sections"],
    queryFn: () => sectionsFn(),
  });
  const { data: contents = [], isLoading: l2 } = useQuery({
    queryKey: ["admin-site-contents"],
    queryFn: () => contentsFn(),
  });

  const upsertSection = useMutation({
    mutationFn: (s: any) => upsertSectionFn({ data: s }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-site-sections"] });
      toast.success("Seção salva");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const delSection = useMutation({
    mutationFn: (id: string) => delSectionFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-site-sections"] }),
  });
  const upsertContent = useMutation({
    mutationFn: (c: any) => upsertContentFn({ data: c }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-site-contents"] });
      toast.success("Conteúdo salvo");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const delContent = useMutation({
    mutationFn: (id: string) => delContentFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-site-contents"] }),
  });

  if (l1 || l2) return <Loader />;

  return (
    <div className="space-y-8 mt-4">
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Seções do site</h3>
          <Button
            size="sm"
            onClick={() =>
              upsertSection.mutate({
                key: `home.new-${Date.now()}`,
                page: "home",
                title: "Nova seção",
                is_active: true,
                sort_order: 99,
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Nova seção
          </Button>
        </div>
        <div className="space-y-3">
          {(sections as any[]).filter((s) => matchesQuery(s, query)).map((s) => (
            <SectionEditor
              key={s.id}
              section={s}
              onSave={(v) => upsertSection.mutate(v)}
              onDelete={(id) => {
                if (confirm("Remover seção?")) delSection.mutate(id);
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Conteúdos (chave/valor)</h3>
          <Button
            size="sm"
            onClick={() =>
              upsertContent.mutate({ key: `content.new-${Date.now()}`, value: { text: "" } })
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Novo conteúdo
          </Button>
        </div>
        <div className="space-y-3">
          {(contents as any[]).map((c) => (
            <KVEditor
              key={c.id}
              row={c}
              onSave={(v) => upsertContent.mutate(v)}
              onDelete={(id) => {
                if (confirm("Remover conteúdo?")) delContent.mutate(id);
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionEditor({
  section,
  onSave,
  onDelete,
}: {
  section: any;
  onSave: (s: any) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<any>(section);
  function set<K extends string>(k: K, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }));
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
      <div className="flex items-center justify-between">
        <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{form.key}</code>
        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(section.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Título</Label>
          <Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Subtítulo</Label>
          <Input value={form.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Texto</Label>
          <Textarea rows={3} value={form.body ?? ""} onChange={(e) => set("body", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">CTA label</Label>
          <Input value={form.cta_label ?? ""} onChange={(e) => set("cta_label", e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">CTA href</Label>
          <Input value={form.cta_href ?? ""} onChange={(e) => set("cta_href", e.target.value)} />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2">
        <label className="flex items-center gap-2 text-xs">
          <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} /> Ativo
        </label>
        <Button size="sm" onClick={() => onSave(form)}>
          <Save className="h-3.5 w-3.5 mr-1" /> Salvar
        </Button>
      </div>
    </div>
  );
}

function KVEditor({
  row,
  onSave,
  onDelete,
}: {
  row: any;
  onSave: (r: any) => void;
  onDelete: (id: string) => void;
}) {
  const [key, setKey] = useState(row.key);
  const [value, setValue] = useState(JSON.stringify(row.value ?? {}, null, 2));
  const [desc, setDesc] = useState(row.description ?? "");
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Chave</Label>
          <Input value={key} onChange={(e) => setKey(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Descrição</Label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-xs">Valor (JSON)</Label>
          <Textarea rows={4} value={value} onChange={(e) => setValue(e.target.value)} className="font-mono text-xs" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-1">
        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(row.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          onClick={() => {
            try {
              const parsed = JSON.parse(value);
              onSave({ ...row, key, value: parsed, description: desc });
            } catch {
              toast.error("JSON inválido");
            }
          }}
        >
          <Save className="h-3.5 w-3.5 mr-1" /> Salvar
        </Button>
      </div>
    </div>
  );
}

// ============ IMAGES ============

function ImagesTab({ query = "" }: { query?: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListSiteImages);
  const upsertFn = useServerFn(adminUpsertSiteImage);
  const delFn = useServerFn(adminDeleteSiteImage);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["admin-site-images"],
    queryFn: () => listFn(),
  });

  const upsert = useMutation({
    mutationFn: (i: any) => upsertFn({ data: i }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-site-images"] });
      toast.success("Imagem salva");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-site-images"] }),
  });

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4 mt-4">
      <p className="text-sm text-slate-600">
        Cole a URL pública da imagem (pode usar serviços externos ou faça upload em outra ferramenta).
      </p>
      <Button
        size="sm"
        onClick={() =>
          upsert.mutate({ key: `image.new-${Date.now()}`, url: "https://", alt: "" })
        }
      >
        <Plus className="h-4 w-4 mr-1" /> Nova imagem
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(images as any[]).map((img) => (
          <ImageEditor
            key={img.id}
            image={img}
            onSave={(v) => upsert.mutate(v)}
            onDelete={(id) => {
              if (confirm("Remover imagem?")) del.mutate(id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ImageEditor({
  image,
  onSave,
  onDelete,
}: {
  image: any;
  onSave: (i: any) => void;
  onDelete: (id: string) => void;
}) {
  const [form, setForm] = useState<any>(image);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
      <div className="aspect-video bg-slate-100 rounded overflow-hidden flex items-center justify-center">
        {form.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.url} alt={form.alt ?? ""} className="object-cover w-full h-full" />
        ) : (
          <span className="text-xs text-slate-400">Sem imagem</span>
        )}
      </div>
      <div>
        <Label className="text-xs">Chave</Label>
        <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">URL</Label>
        <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
      </div>
      <div>
        <Label className="text-xs">Texto alt</Label>
        <Input value={form.alt ?? ""} onChange={(e) => setForm({ ...form, alt: e.target.value })} />
      </div>
      <div className="flex items-center justify-between pt-1">
        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(image.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={() => onSave(form)}>
          <Save className="h-3.5 w-3.5 mr-1" /> Salvar
        </Button>
      </div>
    </div>
  );
}

// ============ SETTINGS ============

function SettingsTab({ query = "" }: { query?: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListSiteSettings);
  const upsertFn = useServerFn(adminUpsertSiteSetting);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: () => listFn(),
  });

  const upsert = useMutation({
    mutationFn: (s: any) => upsertFn({ data: s }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-site-settings"] });
      toast.success("Configuração salva");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro"),
  });

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-3 mt-4">
      <Button
        size="sm"
        onClick={() => upsert.mutate({ key: `setting.new-${Date.now()}`, value: {} })}
      >
        <Plus className="h-4 w-4 mr-1" /> Nova configuração
      </Button>
      {(settings as any[]).map((s) => (
        <KVEditor key={s.id} row={s} onSave={(v) => upsert.mutate(v)} onDelete={() => {}} />
      ))}
    </div>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    </div>
  );
}

// ============ DOMAIN EXTENSIONS ============

function emptyDomainExt() {
  return {
    ext: "",
    slug: "",
    price_brl: 0,
    price_aoa: 0,
    is_active: true,
    is_featured: false,
    sort_order: 0,
  };
}

function DomainsTab({ query = "" }: { query?: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListDomainExtensions);
  const upsertFn = useServerFn(adminUpsertDomainExtension);
  const deleteFn = useServerFn(adminDeleteDomainExtension);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-domain-extensions"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<any | null>(null);

  const upsert = useMutation({
    mutationFn: (p: any) => upsertFn({ data: p }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-domain-extensions"] });
      qc.invalidateQueries({ queryKey: ["domain-extensions"] });
      toast.success("Domínio salvo");
      setEditing(null);
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao salvar"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-domain-extensions"] });
      qc.invalidateQueries({ queryKey: ["domain-extensions"] });
      toast.success("Domínio removido");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao remover"),
  });

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-slate-600">
          Gerencie as extensões exibidas na vitrine pública. Preços refletem na pesquisa, carrinho e checkout.
          Dica: prefira <strong>desativar</strong> em vez de remover para preservar pedidos antigos.
        </p>
        <Button onClick={() => setEditing(emptyDomainExt())}>
          <Plus className="h-4 w-4 mr-1" /> Novo Domínio
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-2">Extensão</th>
              <th className="text-left p-2">Slug</th>
              <th className="text-left p-2">BRL</th>
              <th className="text-left p-2">AKZ/AOA</th>
              <th className="text-left p-2">Ordem</th>
              <th className="text-left p-2">Ativo</th>
              <th className="text-left p-2">Destaque</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {(rows as any[]).map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2 font-mono font-semibold">{r.ext}</td>
                <td className="p-2 text-slate-500">{r.slug}</td>
                <td className="p-2">{Number(r.price_brl).toFixed(2)}</td>
                <td className="p-2">{Number(r.price_aoa).toFixed(2)}</td>
                <td className="p-2">{r.sort_order}</td>
                <td className="p-2">
                  <Switch
                    checked={r.is_active}
                    onCheckedChange={(v) =>
                      upsert.mutate({
                        id: r.id,
                        ext: r.ext,
                        slug: r.slug,
                        price_brl: Number(r.price_brl),
                        price_aoa: Number(r.price_aoa),
                        is_active: v,
                        is_featured: r.is_featured,
                        sort_order: r.sort_order,
                      })
                    }
                  />
                </td>
                <td className="p-2">
                  <Switch
                    checked={r.is_featured}
                    onCheckedChange={(v) =>
                      upsert.mutate({
                        id: r.id,
                        ext: r.ext,
                        slug: r.slug,
                        price_brl: Number(r.price_brl),
                        price_aoa: Number(r.price_aoa),
                        is_active: r.is_active,
                        is_featured: v,
                        sort_order: r.sort_order,
                      })
                    }
                  />
                </td>
                <td className="p-2 text-right whitespace-nowrap">
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-2 text-red-600"
                    onClick={() => {
                      if (confirm(`Remover definitivamente ${r.ext}? Recomenda-se apenas desativar.`))
                        del.mutate(r.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {(rows as any[]).length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-500">
                  Nenhuma extensão cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <DomainExtDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSave={(p) => upsert.mutate(p)}
          saving={upsert.isPending}
        />
      )}
    </div>
  );
}

function DomainExtDialog({
  row,
  onClose,
  onSave,
  saving,
}: {
  row: any;
  onClose: () => void;
  onSave: (p: any) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<any>({ ...row });
  function set<K extends string>(k: K, v: any) {
    setForm((f: any) => ({ ...f, [k]: v }));
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{row.id ? `Editar ${row.ext}` : "Novo domínio"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Extensão * (ex: .com, .mz, .xyz)</Label>
            <Input
              value={form.ext}
              onChange={(e) => set("ext", e.target.value)}
              placeholder=".mz"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Slug interno *</Label>
            <Input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="mz"
            />
          </div>
          <div>
            <Label>Preço BRL *</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price_brl ?? 0}
              onChange={(e) => set("price_brl", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Preço AKZ/AOA *</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price_aoa ?? 0}
              onChange={(e) => set("price_aoa", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Ordem de exibição</Label>
            <Input
              type="number"
              value={form.sort_order ?? 0}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!form.is_active} onCheckedChange={(v) => set("is_active", v)} /> Ativo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={!!form.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
              Destaque
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={saving || !form.ext || !form.slug}
            onClick={() => onSave(form)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

