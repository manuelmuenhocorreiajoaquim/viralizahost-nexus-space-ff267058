import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Globe, Mail, Server, HelpCircle, Plus, Sparkles, ArrowRight,
  Zap, TrendingUp, Activity, ShieldCheck,
} from "lucide-react";
import { Card, PageHeader, StatusPill } from "@/components/dashboard/ui";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Painel — ViralizaHost" }] }),
});

function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const { data: services } = useQuery({
    queryKey: ["dash-services", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("services").select("*").order("created_at", { ascending: false }).limit(6)).data ?? [],
  });
  const { data: cpanel } = useQuery({
    queryKey: ["dash-cpanel", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("cpanel_accounts").select("*").order("created_at", { ascending: false }).limit(6)).data ?? [],
  });
  const { data: invoices } = useQuery({
    queryKey: ["dash-invoices", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("invoices").select("*").eq("status", "pending").limit(3)).data ?? [],
  });

  const name = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Cliente";

  const quick = [
    { label: "Criar site", icon: Globe, to: "/sites" },
    { label: "Criar e-mail", icon: Mail, to: "/emails" },
    { label: "Contratar domínio", icon: Globe, to: "/domains" },
    { label: "Suporte", icon: HelpCircle, to: "/support" },
    { label: "Mais serviços", icon: Plus, to: "/" },
  ] as const;

  const stats = [
    { label: "Hospedagens", value: cpanel?.length ?? 0, icon: Server, tone: "from-blue-500 to-indigo-600" },
    { label: "Serviços activos", value: services?.filter((s: any) => s.status === "active").length ?? 0, icon: Activity, tone: "from-emerald-500 to-teal-600" },
    { label: "Faturas pendentes", value: invoices?.length ?? 0, icon: TrendingUp, tone: "from-amber-500 to-orange-600" },
    { label: "Segurança", value: "OK", icon: ShieldCheck, tone: "from-violet-500 to-fuchsia-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero greeting */}
      <div className="relative overflow-hidden rounded-3xl mb-8 cat-overlay cat-grid bg-gradient-to-br from-[#0b1437] via-[#0f2c8a] to-[#1d6fe5] text-white p-6 md:p-10 shadow-elegant animate-page-in">
        <div className="pointer-events-none absolute -top-20 -right-10 h-72 w-72 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-blue-600/40 blur-3xl" />
        <div className="relative z-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75 inline-flex items-center gap-2">
            <Zap className="h-3.5 w-3.5" /> Painel ViralizaHost
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight mt-2">
            Olá, {name}. <span className="text-white/70">O que queres fazer hoje?</span>
          </h1>
          <p className="text-white/80 mt-2 max-w-xl">
            Gerencia hospedagens, domínios, e-mails, faturas e muito mais — tudo num só lugar.
          </p>

          {/* Assistant box */}
          <div className="bg-white/95 backdrop-blur rounded-2xl p-4 mt-6 shadow-glow-soft">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <textarea
                rows={2}
                placeholder="Pergunte ou peça à ViralizaHost para fazer alguma coisa..."
                className="flex-1 resize-none outline-none text-base placeholder:text-slate-400 text-slate-900 bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`animate-card-rise stagger-${i + 1} relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-4 card-hover`}
          >
            <div className={`absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${s.tone} opacity-20 blur-xl`} />
            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.tone} text-white flex items-center justify-center shadow-lg`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div className="mt-3 text-2xl font-bold tracking-tight">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-10">
        {quick.map((q) => (
          <Link
            key={q.label}
            to={q.to}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-700 hover:shadow-glow-soft text-sm transition-all duration-200 btn-press"
          >
            <q.icon className="h-4 w-4" />
            {q.label}
          </Link>
        ))}
      </div>

      <PageHeader
        title="Os teus serviços"
        actions={
          <Link to="/hosting" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {(cpanel?.length ?? 0) === 0 && (services?.length ?? 0) === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3 text-center py-12">
            <Server className="h-10 w-10 mx-auto text-slate-400" />
            <p className="mt-3 font-medium">Ainda não tens serviços contratados.</p>
            <Link to="/" className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:underline">
              Explorar planos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ) : (
          <>
            {cpanel?.map((a: any, i) => (
              <Link
                key={a.id}
                to="/hosting"
                className={`animate-card-rise stagger-${Math.min(i + 1, 6)} group relative overflow-hidden rounded-2xl border border-slate-200 bg-white card-hover p-5`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-600">Hospedagem</div>
                    <div className="font-semibold truncate mt-0.5">{a.domain}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{a.plan_name ?? a.package}</div>
                  </div>
                  <StatusPill status={a.status} />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{a.username}</span>
                  <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                    Gerenciar <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
            {services?.map((s: any, i) => (
              <Card key={s.id} className={`animate-card-rise stagger-${Math.min(i + 1, 6)} card-hover`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600">{s.type}</div>
                    <div className="font-semibold mt-0.5">{s.name}</div>
                  </div>
                  <StatusPill status={s.status} />
                </div>
                {s.expires_at && (
                  <div className="text-xs text-slate-500 mt-3">
                    Expira em {new Date(s.expires_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
                <button className="mt-4 w-full text-sm text-blue-600 hover:underline text-left">Gerenciar →</button>
              </Card>
            ))}
          </>
        )}
      </div>

      <PageHeader title="Faturas pendentes" />
      <div className="space-y-2">
        {(invoices ?? []).length === 0 ? (
          <Card className="text-sm text-slate-500">Sem faturas pendentes 🎉</Card>
        ) : (
          invoices!.map((i: any) => (
            <Card key={i.id} className="flex items-center justify-between card-hover">
              <div>
                <div className="font-medium">{i.description}</div>
                <div className="text-xs text-slate-500">
                  Vence em {i.due_date ? new Date(i.due_date).toLocaleDateString("pt-BR") : "—"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">
                  {i.currency === "BRL" ? "R$" : i.currency} {Number(i.amount).toLocaleString("pt-BR")}
                </span>
                <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 btn-press">
                  Pagar
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
