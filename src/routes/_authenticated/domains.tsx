import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Globe, Search, Sparkles, Clock, CheckCircle2, XCircle, Settings } from "lucide-react";
import { Card, EmptyState } from "@/components/dashboard/ui";
import { CategoryBanner } from "@/components/dashboard/CategoryBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { listMyDomainOrders } from "@/lib/provisioning.functions";
import { DomainManageDialog } from "@/components/dashboard/DomainManageDialog";

export const Route = createFileRoute("/_authenticated/domains")({ component: Page });

function statusBadge(status: string) {
  const s = (status ?? "").toUpperCase();
  if (s === "ATIVO" || s === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" /> Ativo
      </span>
    );
  }
  if (s === "CANCELADO" || s === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <XCircle className="h-3 w-3" /> Cancelado
      </span>
    );
  }
  // PENDENTE_ATIVACAO + AGUARDANDO_COMPRA_HOSTINGER → mesma mensagem para o cliente.
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="h-3 w-3" /> Pendente de Ativação
    </span>
  );
}

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

function Page() {
  const { user } = useAuth();
  const listFn = useServerFn(listMyDomainOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["my-domain-orders", user?.id],
    enabled: !!user,
    queryFn: () => listFn(),
    refetchInterval: 15_000,
  });

  const [manageDomain, setManageDomain] = useState<string | null>(null);

  const orders = data?.orders ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="domains"
        icon={Globe}
        eyebrow="DNS & Registos"
        title="Domínios"
        description="Acompanhe os seus domínios comprados e o status de ativação."
        actions={
          <Link
            to="/dominios/registrar"
            className="px-4 py-2 rounded-lg bg-white text-blue-700 text-sm font-semibold hover:bg-white/90 btn-press inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> Registar novo
          </Link>
        }
      />
      {!isLoading && orders.length === 0 ? (
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
                <th className="text-left px-5 py-3">Valor pago</th>
                <th className="text-left px-5 py-3">Data</th>
                <th className="text-right px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any, i: number) => {
                const status = (o.status ?? "").toUpperCase();
                const isActive = status === "ATIVO";
                return (
                  <tr
                    key={o.id}
                    className={`border-t border-slate-100 hover:bg-slate-50/60 transition-colors animate-card-rise stagger-${Math.min(i + 1, 6)}`}
                  >
                    <td className="px-5 py-3 font-medium">{o.domain_name}</td>
                    <td className="px-5 py-3">{statusBadge(o.status)}</td>
                    <td className="px-5 py-3 text-slate-700">
                      {fmtCurrency(Number(o.price ?? 0), o.currency ?? "BRL")}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setManageDomain(o.domain_name)}
                        >
                          <Settings className="h-3.5 w-3.5 mr-1" /> Gerir Domínio
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          Em processamento
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 text-xs text-slate-500 border-t border-slate-100 bg-slate-50/40">
            O seu domínio está em processamento e será ativado após confirmação administrativa
            (até 24h úteis). Após ativação, você poderá gerir nameservers e registros DNS.
          </div>
        </Card>
      )}

      {manageDomain && (
        <DomainManageDialog
          open={!!manageDomain}
          onOpenChange={(o) => !o && setManageDomain(null)}
          domain={manageDomain}
        />
      )}
    </div>
  );
}
