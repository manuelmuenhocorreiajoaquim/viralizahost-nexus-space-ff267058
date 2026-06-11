import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Mail, Inbox, ExternalLink, Clock, CheckCircle2, XCircle, LayoutDashboard, Globe } from "lucide-react";
import { Card, EmptyState } from "@/components/dashboard/ui";
import { CategoryBanner } from "@/components/dashboard/CategoryBanner";
import { useAuth } from "@/lib/use-auth";
import { listMyEmailOrders } from "@/lib/provisioning.functions";

export const Route = createFileRoute("/_authenticated/emails")({ component: Page });

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

function StatusBadge({ status }: { status: string }) {
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
  const listFn = useServerFn(listMyEmailOrders);
  const { data, isLoading } = useQuery({
    queryKey: ["my-email-orders", user?.id],
    enabled: !!user,
    queryFn: () => listFn(),
  });
  const orders = data?.orders ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="emails"
        icon={Mail}
        eyebrow="Comunicação"
        title="E-mails Corporativos"
        description="E-mails profissionais com webmail, IMAP, SMTP e antispam."
      />
      {!isLoading && orders.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Sem planos de e-mail"
          description="Contrata o teu plano de e-mail profissional na ViralizaHost."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((e, i) => {
            const active = e.status === "ATIVO";
            const link = e.webmail_url || e.cpanel_url;
            return (
              <Card key={e.id} className={`card-hover animate-card-rise stagger-${Math.min(i + 1, 6)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500/15 to-blue-500/10 ring-1 ring-sky-500/20 flex items-center justify-center shrink-0">
                      <Mail className="h-5 w-5 text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{e.plan_name}</div>
                      {e.domain && <div className="text-xs text-slate-500 truncate">{e.domain}</div>}
                    </div>
                  </div>
                  <StatusBadge status={e.status} />
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
                  <div>
                    <div className="text-xs text-slate-500">Valor pago</div>
                    <div className="font-semibold">{fmtCurrency(Number(e.price), e.currency)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Data</div>
                    <div className="font-semibold">{new Date(e.created_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>

                {active ? (
                  <div className="mt-4 flex flex-col gap-2">
                    <a
                      href="https://server.viralizahost.com:2083"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm hover:shadow-glow-soft btn-press"
                    >
                      Entrar no cPanel <LayoutDashboard className="h-4 w-4" />
                    </a>
                    {e.domain && (
                      <a
                        href={`https://${e.domain}/webmail`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm hover:bg-slate-50 btn-press"
                      >
                        Abrir Webmail <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                    O seu plano de e-mail está em processamento e será ativado após confirmação administrativa.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
