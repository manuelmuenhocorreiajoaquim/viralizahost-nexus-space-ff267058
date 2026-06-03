import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMyDomain, updateMyDomainDns } from "@/lib/provisioning.functions";

type DnsRecord = {
  id?: string;
  type: "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS" | "SRV";
  name: string;
  value: string;
  ttl: number;
  priority?: number;
};

const RECORD_TYPES: DnsRecord["type"][] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV"];

export function DomainManageDialog({
  open,
  onOpenChange,
  domain,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  domain: string;
}) {
  const qc = useQueryClient();
  const getFn = useServerFn(getMyDomain);
  const updateFn = useServerFn(updateMyDomainDns);

  const { data, isLoading } = useQuery({
    queryKey: ["my-domain", domain],
    enabled: open,
    queryFn: () => getFn({ data: { domain } }),
  });

  const [nameservers, setNameservers] = useState<string[]>([]);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [targetIp, setTargetIp] = useState<string>("");
  const [domainId, setDomainId] = useState<string>("");

  useEffect(() => {
    if (data?.domain) {
      setDomainId(data.domain.id);
      const ns = Array.isArray(data.domain.nameservers) ? (data.domain.nameservers as string[]) : [];
      setNameservers(ns.length ? ns : ["ns1.viralizahost.com", "ns2.viralizahost.com"]);
      setRecords((data.domain.dns_records ?? []) as DnsRecord[]);
      setTargetIp((data.domain.target_ip as string | null) ?? "");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id: domainId,
          nameservers: nameservers.filter((n) => n.trim()),
          dns_records: records,
          target_ip: targetIp.trim() || null,
        },
      }),
    onSuccess: () => {
      toast.success("Configurações de DNS salvas.");
      qc.invalidateQueries({ queryKey: ["my-domain", domain] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao salvar"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerir {domain}</DialogTitle>
          <DialogDescription>
            Configure nameservers, registros DNS e o IP/CNAME de destino do seu domínio.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Nameservers */}
            <section>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Nameservers</h3>
              <div className="space-y-2">
                {nameservers.map((ns, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={ns}
                      onChange={(e) => {
                        const next = [...nameservers];
                        next[i] = e.target.value;
                        setNameservers(next);
                      }}
                      placeholder={`ns${i + 1}.exemplo.com`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setNameservers(nameservers.filter((_, k) => k !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNameservers([...nameservers, ""])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar nameserver
                </Button>
              </div>
            </section>

            {/* Apontamento rápido */}
            <section>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Apontamento rápido (IP/A)</h3>
              <Input
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                placeholder="Ex: 192.0.2.10"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Opcional. Use registros DNS abaixo para configurações avançadas.
              </p>
            </section>

            {/* Registros DNS */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-800">Registros DNS</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRecords([
                      ...records,
                      { type: "A", name: "@", value: "", ttl: 3600 },
                    ])
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Novo registro
                </Button>
              </div>
              <div className="space-y-2">
                {records.length === 0 && (
                  <p className="text-xs text-slate-500">Nenhum registro configurado.</p>
                )}
                {records.map((r, i) => (
                  <div
                    key={r.id ?? i}
                    className="grid grid-cols-12 gap-2 items-center bg-slate-50 border border-slate-200 rounded-lg p-2"
                  >
                    <select
                      className="col-span-2 h-9 rounded-md border border-input bg-white px-2 text-sm"
                      value={r.type}
                      onChange={(e) => {
                        const next = [...records];
                        next[i] = { ...r, type: e.target.value as DnsRecord["type"] };
                        setRecords(next);
                      }}
                    >
                      {RECORD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <Input
                      className="col-span-3"
                      placeholder="Nome (@, www, ...)"
                      value={r.name}
                      onChange={(e) => {
                        const next = [...records];
                        next[i] = { ...r, name: e.target.value };
                        setRecords(next);
                      }}
                    />
                    <Input
                      className="col-span-5"
                      placeholder="Valor"
                      value={r.value}
                      onChange={(e) => {
                        const next = [...records];
                        next[i] = { ...r, value: e.target.value };
                        setRecords(next);
                      }}
                    />
                    <Input
                      className="col-span-1"
                      type="number"
                      min={60}
                      max={86400}
                      value={r.ttl}
                      onChange={(e) => {
                        const next = [...records];
                        next[i] = { ...r, ttl: Number(e.target.value) || 3600 };
                        setRecords(next);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="col-span-1"
                      onClick={() => setRecords(records.filter((_, k) => k !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !domainId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Salvar alterações
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
