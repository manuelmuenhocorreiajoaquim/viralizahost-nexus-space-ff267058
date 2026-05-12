import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Globe } from "lucide-react";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/dashboard/ui";

export const Route = createFileRoute("/_authenticated/domains")({ component: Page });

function Page() {
  const { user } = useAuth();
  const { data: domains, isLoading } = useQuery({
    queryKey: ["domains", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("domains").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title="Domínios" subtitle="Os teus domínios registrados." />
      {!isLoading && domains?.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="Sem domínios registrados"
          description="Regista o teu primeiro domínio com a ViralizaHost."
        />
      ) : (
        <Card className="p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Domínio</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Vencimento</th>
                <th className="text-right px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {domains?.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium">{d.domain}</td>
                  <td className="px-5 py-3">
                    <StatusPill status={d.status} />
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {d.expires_at ? new Date(d.expires_at).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-blue-600 hover:underline">Gerenciar DNS</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
