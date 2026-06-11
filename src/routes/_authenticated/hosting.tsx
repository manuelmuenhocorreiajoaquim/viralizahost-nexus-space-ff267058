import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Server, ExternalLink, Activity, BarChart3, HardDrive, Globe2, Network, Clock, CheckCircle2, XCircle, LayoutDashboard } from "lucide-react";
import { Card, EmptyState, StatusPill } from "@/components/dashboard/ui";
import { CategoryBanner } from "@/components/dashboard/CategoryBanner";
import { useState } from "react";
import { toast } from "sonner";
import { listMyHostingOrders } from "@/lib/provisioning.functions";

export const Route = createFileRoute("/_authenticated/hosting")({ component: Page });

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

function HostingStatus({ status }: { status: string }) {
  const v = (status ?? "").toUpperCase();
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
      <Clock className="h-3 w-3" /> Pendente de Ativação
    </span>
  );
}

function Page() {
  const { user } = useAuth();
  const listHostingOrdersFn = useServerFn(listMyHostingOrders);

  const { data: hostingOrdersData, isLoading: loadingHosting } = useQuery({
    queryKey: ["my-hosting-orders", user?.id],
    enabled: !!user,
    queryFn: () => listHostingOrdersFn(),
  });
  const hostingOrders = hostingOrdersData?.orders ?? [];

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["cpanel_accounts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("cpanel_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: services } = useQuery({
    queryKey: ["services", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("services")
          .select("*")
          .neq("type", "hosting")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const empty =
    !isLoading &&
    !loadingHosting &&
    (accounts?.length ?? 0) === 0 &&
    (services?.length ?? 0) === 0 &&
    hostingOrders.length === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="hosting"
        icon={Server}
        eyebrow="Infraestrutura"
        title="Hospedagens & Servidores"
        description="Gerencia todas as tuas contas cPanel, VPS e serviços contratados num só painel."
      />

      {empty ? (
        <EmptyState
          icon={Server}
          title="Ainda não tens serviços activos"
          description="Quando contratares uma hospedagem, VPS ou servidor dedicado, aparecerá aqui automaticamente."
        />
      ) : (
        <div className="space-y-8">
          {hostingOrders.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                Meus Planos de Hospedagem
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {hostingOrders.map((h: any, i: number) => {
                  const active = h.status === "ATIVO";
                  return (
                    <Card key={h.id} className={`card-hover animate-card-rise stagger-${Math.min(i + 1, 6)}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 ring-1 ring-blue-500/20 flex items-center justify-center shrink-0">
                            <Server className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{h.plan_name}</div>
                            {h.domain && <div className="text-xs text-slate-500 truncate">{h.domain}</div>}
                          </div>
                        </div>
                        <HostingStatus status={h.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                        {h.storage_gb != null && (
                          <div>
                            <div className="text-xs text-slate-500">Armazenamento</div>
                            <div className="font-semibold">{h.storage_gb} GB</div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-slate-500">Valor pago</div>
                          <div className="font-semibold">{fmtCurrency(Number(h.price), h.currency)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-500">Data</div>
                          <div className="font-semibold">{new Date(h.created_at).toLocaleDateString("pt-BR")}</div>
                        </div>
                        {active && h.activated_at && (
                          <div>
                            <div className="text-xs text-slate-500">Ativação</div>
                            <div className="font-semibold">{new Date(h.activated_at).toLocaleDateString("pt-BR")}</div>
                          </div>
                        )}
                        {active && h.server_ip && (
                          <div className="col-span-2">
                            <div className="text-xs text-slate-500">IP do servidor</div>
                            <div className="font-mono text-xs">{h.server_ip}</div>
                          </div>
                        )}
                      </div>

                      {active ? (
                        <div className="mt-4">
                          <a
                            href="https://server.viralizahost.com:2083"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm hover:shadow-glow-soft btn-press"
                          >
                            Abrir cPanel <LayoutDashboard className="h-4 w-4" />
                          </a>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                          A sua hospedagem está em processo de ativação manual pela nossa equipa. Prazo até 24h úteis.
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {(accounts?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                Contas cPanel
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {accounts!.map((a, i) => (
                  <CpanelCard key={a.id} account={a} index={i} />
                ))}
              </div>
            </div>
          )}
          {(services?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-4">
                Outros serviços
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services!.map((s, i) => (
                  <Card key={s.id} className={`animate-card-rise stagger-${Math.min(i + 1, 6)} card-hover`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-xs text-slate-500 uppercase mt-0.5">{s.type}</div>
                      </div>
                      <StatusPill status={s.status} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CpanelCard({ account, index }: { account: any; index: number }) {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openingSso, setOpeningSso] = useState(false);
  const ns = Array.isArray(account.nameservers) ? account.nameservers : [];

  const loadUsage = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("cpanel-usage", {
        body: { account_id: account.id },
      });
      if (error) throw error;
      setUsage(data?.usage);
      if (!data?.usage) toast.info("Sem dados de uso ainda");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white card-hover animate-card-rise stagger-${Math.min(index + 1, 6)}`}
    >
      <div className="relative h-28 cat-hosting cat-overlay cat-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
        <div className="absolute inset-0 flex items-center justify-between px-5">
          <div className="flex items-center gap-3 text-white relative z-10">
            <div className="h-12 w-12 rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur-md flex items-center justify-center">
              <Server className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">
                cPanel
              </div>
              <div className="font-semibold truncate text-white drop-shadow">{account.domain}</div>
            </div>
          </div>
          <div className="relative z-10">
            <StatusPill status={account.status} />
          </div>
        </div>
        <div className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium text-slate-700">{account.plan_name ?? account.package}</span>
          <span className="font-mono">{account.username}</span>
        </div>

        <dl className="grid grid-cols-2 gap-3 mt-4 text-xs">
          {account.server_ip && (
            <div className="flex items-center gap-2 text-slate-600">
              <Network className="h-3.5 w-3.5 text-blue-500" />
              <span className="font-mono truncate">{account.server_ip}</span>
            </div>
          )}
          {account.disk_used_mb != null && !usage && (
            <div className="flex items-center gap-2 text-slate-600">
              <HardDrive className="h-3.5 w-3.5 text-emerald-500" />
              <span>{account.disk_used_mb} MB</span>
            </div>
          )}
        </dl>

        {ns.length > 0 && (
          <div className="mt-3 text-xs text-slate-500 flex items-start gap-2">
            <Globe2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-indigo-500" />
            <span className="truncate">NS: {ns.join(" · ")}</span>
          </div>
        )}

        {usage && (
          <div className="mt-4 space-y-2 text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
            <UsageBar label="Disco" used={usage.disk_used_mb} quota={usage.disk_quota_mb} unit="MB" tone="bg-blue-500" />
            <UsageBar label="Banda" used={usage.bandwidth_used_mb} quota={usage.bandwidth_quota_mb} unit="MB" tone="bg-emerald-500" />
            <div className="flex justify-between pt-1">
              <span>E-mails</span>
              <span className="font-semibold">{usage.email_count}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-5">
          <button
            disabled={openingSso}
            onClick={async () => {
              setOpeningSso(true);
              try {
                const { data, error } = await supabase.functions.invoke("whm-cpanel-sso", {
                  body: { account_id: account.id },
                });
                if (error) throw error;
                if (data?.error) throw new Error(data.error);
                if (data?.url) window.open(data.url, "_blank", "noopener");
                else toast.error("Não foi possível abrir o cPanel");
              } catch (e: any) {
                toast.error(e.message);
              } finally {
                setOpeningSso(false);
              }
            }}
            className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm hover:shadow-glow-soft btn-press inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <CpanelIcon className="h-4 w-4" />
            {openingSso ? "Abrindo..." : "Acessar cPanel"}
            <ExternalLink className="h-3 w-3 opacity-80" />
          </button>
          <button
            onClick={loadUsage}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 btn-press inline-flex items-center gap-1.5"
            title="Ver uso"
          >
            {loading ? <Activity className="h-3.5 w-3.5 animate-pulse" /> : <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />}
            <span className="hidden sm:inline">Uso</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function UsageBar({ label, used, quota, unit, tone }: { label: string; used: number; quota?: number; unit: string; tone: string }) {
  const pct = quota ? Math.min(100, Math.round((used / quota) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span className="font-medium text-slate-700">
          {used} {unit}{quota ? ` / ${quota} ${unit}` : ""}
        </span>
      </div>
      {quota ? (
        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div className={`h-full ${tone} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function CpanelIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#FF6C2C" />
      <circle cx="12" cy="12" r="3.2" fill="#fff" />
    </svg>
  );
}
