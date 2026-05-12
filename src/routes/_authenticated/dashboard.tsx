import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Globe, Mail, Server, HelpCircle, Plus, Sparkles, ArrowRight } from "lucide-react";
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
      (await supabase.from("services").select("*").order("created_at", { ascending: false }).limit(4)).data ?? [],
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

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
          Olá, {name}. <span className="text-slate-400">O que queres fazer hoje?</span>
        </h1>
      </div>

      {/* Assistant box */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-1 shadow-lg shadow-blue-600/20 mb-4">
        <div className="bg-white rounded-[14px] p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <textarea
              rows={2}
              placeholder="Pergunte ou peça à ViralizaHost para fazer alguma coisa..."
              className="flex-1 resize-none outline-none text-base placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-10">
        {quick.map((q) => (
          <Link
            key={q.label}
            to={q.to}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-700 text-sm transition"
          >
            <q.icon className="h-4 w-4" />
            {q.label}
          </Link>
        ))}
      </div>

      <PageHeader
        title="Os teus serviços"
        actions={
          <Link
            to="/hosting"
            className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {(services ?? []).length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3 text-center py-10">
            <Server className="h-10 w-10 mx-auto text-slate-400" />
            <p className="mt-3 font-medium">Ainda não tens serviços contratados.</p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:underline"
            >
              Explorar planos <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        ) : (
          services!.map((s) => (
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
              <button className="mt-4 w-full text-sm text-blue-600 hover:underline text-left">
                Gerenciar →
              </button>
            </Card>
          ))
        )}
      </div>

      <PageHeader title="Faturas pendentes" />
      <div className="space-y-2">
        {(invoices ?? []).length === 0 ? (
          <Card className="text-sm text-slate-500">Sem faturas pendentes 🎉</Card>
        ) : (
          invoices!.map((i) => (
            <Card key={i.id} className="flex items-center justify-between">
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
                <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
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
