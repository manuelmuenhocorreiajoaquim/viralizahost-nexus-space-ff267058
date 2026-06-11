import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, Globe } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/dashboard/ui";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  adminListDnsChangeRequests,
  adminMarkDnsChangeApplied,
} from "@/lib/provisioning.functions";

export const Route = createFileRoute("/_authenticated/admin/dns-requests")({
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListDnsChangeRequests);
  const markFn = useServerFn(adminMarkDnsChangeApplied);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dns-requests"],
    queryFn: () => listFn(),
    refetchInterval: 20_000,
  });
  const [notes, setNotes] = useState<Record<string, string>>({});

  const markMutation = useMutation({
    mutationFn: (vars: { id: string; note?: string }) =>
      markFn({ data: { id: vars.id, note: vars.note } }),
    onSuccess: () => {
      toast.success("Pedido marcado como aplicado.");
      qc.invalidateQueries({ queryKey: ["admin-dns-requests"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao atualizar"),
  });

  const requests = (data?.requests ?? []) as any[];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="h-6 w-6 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pedidos de DNS</h1>
          <p className="text-sm text-slate-600">
            Configurações solicitadas pelos clientes para aplicar manualmente na Hostinger/WHM.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="p-8 text-center text-slate-500 text-sm">
          Sem pedidos pendentes.
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{r.domain}</div>
                  <div className="text-xs text-slate-500">
                    Solicitado em{" "}
                    {r.dns_change_requested_at
                      ? new Date(r.dns_change_requested_at).toLocaleString("pt-BR")
                      : "—"}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Pendente
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    Nameservers
                  </div>
                  <ul className="list-disc list-inside text-slate-700">
                    {(r.nameservers ?? []).map((n: string, i: number) => (
                      <li key={i} className="font-mono text-xs">
                        {n}
                      </li>
                    ))}
                    {(!r.nameservers || r.nameservers.length === 0) && (
                      <li className="text-slate-400 italic list-none">—</li>
                    )}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    IP de destino (A)
                  </div>
                  <div className="font-mono text-xs text-slate-700">
                    {r.target_ip || "—"}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  Registros DNS
                </div>
                {(r.dns_records ?? []).length === 0 ? (
                  <div className="text-xs text-slate-400 italic">Nenhum</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="text-slate-500">
                        <tr>
                          <th className="text-left pr-3 py-1">Tipo</th>
                          <th className="text-left pr-3 py-1">Nome</th>
                          <th className="text-left pr-3 py-1">Valor</th>
                          <th className="text-left pr-3 py-1">TTL</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {(r.dns_records as any[]).map((rec, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="pr-3 py-1">{rec.type}</td>
                            <td className="pr-3 py-1">{rec.name}</td>
                            <td className="pr-3 py-1 break-all">{rec.value}</td>
                            <td className="pr-3 py-1">{rec.ttl}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                <Textarea
                  placeholder="Observações internas (opcional)"
                  value={notes[r.id] ?? ""}
                  onChange={(e) =>
                    setNotes((s) => ({ ...s, [r.id]: e.target.value }))
                  }
                  className="text-sm"
                  rows={2}
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() =>
                      markMutation.mutate({ id: r.id, note: notes[r.id] })
                    }
                    disabled={markMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {markMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Marcar como aplicado
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
