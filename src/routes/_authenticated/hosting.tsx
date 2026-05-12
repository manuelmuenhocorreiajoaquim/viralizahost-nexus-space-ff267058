import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Server } from "lucide-react";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/dashboard/ui";

export const Route = createFileRoute("/_authenticated/hosting")({ component: Page });

function Page() {
  const { user } = useAuth();
  const { data: services, isLoading } = useQuery({
    queryKey: ["services", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("services").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Hospedagens e Servidores" subtitle="Gerencia todos os teus serviços contratados." />
      {!isLoading && services?.length === 0 ? (
        <EmptyState
          icon={Server}
          title="Ainda não tens serviços activos"
          description="Quando contratares uma hospedagem, VPS ou servidor dedicado, aparecerá aqui."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services?.map((s) => (
            <Card key={s.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-slate-500 uppercase mt-0.5">{s.type}</div>
                </div>
                <StatusPill status={s.status} />
              </div>
              {s.expires_at && (
                <div className="text-xs text-slate-500 mt-3">
                  Expira em {new Date(s.expires_at).toLocaleDateString("pt-BR")}
                </div>
              )}
              <button className="mt-4 w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                Gerenciar
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
