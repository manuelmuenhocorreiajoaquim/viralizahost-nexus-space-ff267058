import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, Download } from "lucide-react";
import { Card, EmptyState, StatusPill } from "@/components/dashboard/ui";
import { CategoryBanner } from "@/components/dashboard/CategoryBanner";

export const Route = createFileRoute("/_authenticated/invoices")({ component: Page });

function Page() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["invoices", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("invoices").select("*").order("due_date", { ascending: false })).data ?? [],
  });

  const pending = data?.filter((i) => i.status === "pending") ?? [];
  const paid = data?.filter((i) => i.status === "paid") ?? [];

  return (
    <div className="max-w-6xl mx-auto">
      <CategoryBanner
        variant="invoices"
        icon={Receipt}
        eyebrow="Financeiro"
        title="Faturas"
        description="Histórico financeiro, pagamentos e recibos das tuas contratações."
      />
      {!isLoading && data?.length === 0 ? (
        <EmptyState icon={Receipt} title="Sem faturas" description="As tuas faturas aparecerão aqui." />
      ) : (
        <>
          <h3 className="font-semibold mb-3">Pendentes ({pending.length})</h3>
          <div className="space-y-2 mb-8">
            {pending.length === 0 && <Card className="text-sm text-slate-500">Sem faturas pendentes 🎉</Card>}
            {pending.map((i, idx) => <InvoiceRow key={i.id} inv={i} pay idx={idx} />)}
          </div>
          <h3 className="font-semibold mb-3">Pagas ({paid.length})</h3>
          <div className="space-y-2">
            {paid.map((i, idx) => <InvoiceRow key={i.id} inv={i} idx={idx} />)}
          </div>
        </>
      )}
    </div>
  );
}

function InvoiceRow({ inv, pay, idx }: { inv: any; pay?: boolean; idx: number }) {
  return (
    <Card className={`flex items-center justify-between card-hover animate-card-rise stagger-${Math.min(idx + 1, 6)}`}>
      <div>
        <div className="font-medium">{inv.description}</div>
        <div className="text-xs text-slate-500">
          {inv.due_date ? `Vence ${new Date(inv.due_date).toLocaleDateString("pt-BR")}` : "Sem data"}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusPill status={inv.status} />
        <span className="font-semibold">
          {inv.currency === "BRL" ? "R$" : inv.currency} {Number(inv.amount).toLocaleString("pt-BR")}
        </span>
        <button className="p-2 rounded-lg hover:bg-slate-100 btn-press" title="Baixar PDF">
          <Download className="h-4 w-4 text-slate-600" />
        </button>
        {pay && (
          <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 text-white text-sm hover:shadow-glow-soft btn-press">
            Pagar agora
          </button>
        )}
      </div>
    </Card>
  );
}
