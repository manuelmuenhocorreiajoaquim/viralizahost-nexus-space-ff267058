import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/dashboard/ui";

export const Route = createFileRoute("/_authenticated/emails")({ component: Page });

function Page() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["emails", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("email_accounts").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="E-mails corporativos" subtitle="Os teus planos de e-mail contratados." />
      {!isLoading && data?.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="Sem planos de e-mail"
          description="Cria o teu primeiro e-mail @teudominio com a ViralizaHost."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((e) => (
            <Card key={e.id}>
              <div className="flex items-start justify-between">
                <div className="font-semibold">{e.plan_name}</div>
                <StatusPill status={e.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Contas</div>
                  <div className="font-semibold">{e.accounts_count}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Armazenamento</div>
                  <div className="font-semibold">{e.storage_gb} GB</div>
                </div>
              </div>
              <button className="mt-4 w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                Gerenciar e-mails
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
