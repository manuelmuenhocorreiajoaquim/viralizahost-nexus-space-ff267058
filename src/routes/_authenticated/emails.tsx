import { createFileRoute } from "@tanstack/react-router";
import { Mail, Inbox } from "lucide-react";
import { Card, EmptyState, StatusPill } from "@/components/dashboard/ui";
import { CategoryBanner } from "@/components/dashboard/CategoryBanner";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      <CategoryBanner
        variant="emails"
        icon={Mail}
        eyebrow="Comunicação"
        title="E-mails Corporativos"
        description="E-mails profissionais @teudominio.com com webmail, IMAP, SMTP e antispam."
      />
      {!isLoading && data?.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Sem planos de e-mail"
          description="Cria o teu primeiro e-mail @teudominio com a ViralizaHost."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.map((e, i) => (
            <Card key={e.id} className={`card-hover animate-card-rise stagger-${Math.min(i + 1, 6)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500/15 to-blue-500/10 ring-1 ring-sky-500/20 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="font-semibold">{e.plan_name}</div>
                </div>
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
              <button className="mt-4 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm hover:shadow-glow-soft btn-press">
                Gerenciar e-mails
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
