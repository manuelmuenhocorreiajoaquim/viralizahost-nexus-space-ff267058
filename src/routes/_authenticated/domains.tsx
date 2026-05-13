import { createFileRoute } from "@tanstack/react-router";
import { Globe, Search, Sparkles } from "lucide-react";
import { Card, EmptyState, StatusPill } from "@/components/dashboard/ui";
import { CategoryBanner } from "@/components/dashboard/CategoryBanner";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
      <CategoryBanner
        variant="domains"
        icon={Globe}
        eyebrow="DNS & Registos"
        title="Domínios"
        description="Gere os teus domínios, configura DNS e renova com um clique."
        actions={
          <button className="px-4 py-2 rounded-lg bg-white text-blue-700 text-sm font-semibold hover:bg-white/90 btn-press inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Registar novo
          </button>
        }
      />
      {!isLoading && domains?.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Sem domínios registrados"
          description="Regista o teu primeiro domínio com a ViralizaHost — pesquisa disponibilidade em segundos."
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
              {domains?.map((d, i) => (
                <tr key={d.id} className={`border-t border-slate-100 hover:bg-slate-50/60 transition-colors animate-card-rise stagger-${Math.min(i + 1, 6)}`}>
                  <td className="px-5 py-3 font-medium">{d.domain}</td>
                  <td className="px-5 py-3"><StatusPill status={d.status} /></td>
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
