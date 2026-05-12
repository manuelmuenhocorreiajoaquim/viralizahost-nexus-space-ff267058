import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Server, ExternalLink, Activity } from "lucide-react";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/dashboard/ui";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hosting")({ component: Page });

function Page() {
  const { user } = useAuth();
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

  const empty = !isLoading && (accounts?.length ?? 0) === 0 && (services?.length ?? 0) === 0;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Hospedagens e Servidores" subtitle="Gerencia todos os teus serviços contratados." />
      {empty ? (
        <EmptyState
          icon={Server}
          title="Ainda não tens serviços activos"
          description="Quando contratares uma hospedagem, VPS ou servidor dedicado, aparecerá aqui."
        />
      ) : (
        <div className="space-y-6">
          {(accounts?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                Contas cPanel
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts!.map((a) => (
                  <CpanelCard key={a.id} account={a} />
                ))}
              </div>
            </div>
          )}
          {(services?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">
                Outros serviços
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services!.map((s) => (
                  <Card key={s.id}>
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

function CpanelCard({ account }: { account: any }) {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
    <Card>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="font-semibold truncate">{account.domain}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            {account.plan_name ?? account.package} · {account.username}
          </div>
        </div>
        <StatusPill status={account.status} />
      </div>
      {ns.length > 0 && (
        <div className="text-xs text-slate-500 mt-3">
          NS: {ns.join(" · ")}
        </div>
      )}
      {account.server_ip && (
        <div className="text-xs text-slate-500">IP: {account.server_ip}</div>
      )}
      {usage && (
        <div className="mt-3 text-xs text-slate-600 space-y-1">
          <div>Disco: {usage.disk_used_mb} MB{usage.disk_quota_mb ? ` / ${usage.disk_quota_mb} MB` : ""}</div>
          <div>Banda: {usage.bandwidth_used_mb} MB{usage.bandwidth_quota_mb ? ` / ${usage.bandwidth_quota_mb} MB` : ""}</div>
          <div>Emails: {usage.email_count}</div>
        </div>
      )}
      <div className="flex items-center gap-2 mt-4">
        {account.cpanel_url && (
          <a
            href={account.cpanel_url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 inline-flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Login cPanel
          </a>
        )}
        <button
          onClick={loadUsage}
          disabled={loading}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm hover:bg-slate-50 inline-flex items-center gap-1.5"
        >
          <Activity className="h-3.5 w-3.5" /> {loading ? "..." : "Uso"}
        </button>
      </div>
    </Card>
  );
}
