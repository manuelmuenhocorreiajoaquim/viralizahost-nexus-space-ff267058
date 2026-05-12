import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { HelpCircle, MessageCircle, BookOpen, Loader2 } from "lucide-react";
import { Card, PageHeader, StatusPill } from "@/components/dashboard/ui";

export const Route = createFileRoute("/_authenticated/support")({ component: Page });

function Page() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", priority: "normal" });

  const { data: tickets } = useQuery({
    queryKey: ["tickets", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("support_tickets").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("support_tickets")
        .insert({ ...form, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket criado!");
      setForm({ subject: "", message: "", priority: "normal" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Suporte"
        subtitle="Estamos aqui para ajudar."
        actions={
          <button
            onClick={() => setOpen(!open)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Abrir ticket
          </button>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <MessageCircle className="h-6 w-6 text-blue-600" />
          <h3 className="font-semibold mt-3">WhatsApp Suporte</h3>
          <p className="text-sm text-slate-500 mt-1">Atendimento rápido.</p>
          <a
            href="https://wa.me/244000000000"
            target="_blank"
            className="mt-3 inline-block text-sm text-blue-600 hover:underline"
          >
            Conversar →
          </a>
        </Card>
        <Card>
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h3 className="font-semibold mt-3">Base de conhecimento</h3>
          <p className="text-sm text-slate-500 mt-1">Tutoriais e guias.</p>
        </Card>
        <Card>
          <HelpCircle className="h-6 w-6 text-blue-600" />
          <h3 className="font-semibold mt-3">Perguntas frequentes</h3>
          <p className="text-sm text-slate-500 mt-1">Respostas rápidas.</p>
        </Card>
      </div>

      {open && (
        <Card className="mb-6">
          <h3 className="font-semibold mb-4">Novo ticket</h3>
          <div className="space-y-3">
            <input
              placeholder="Assunto"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 text-sm"
            />
            <textarea
              placeholder="Descreve o teu problema..."
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 text-sm"
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-600 text-sm"
            >
              <option value="low">Baixa</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
            </select>
            <button
              onClick={() => create.mutate()}
              disabled={!form.subject || !form.message || create.isPending}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Enviar
            </button>
          </div>
        </Card>
      )}

      <h3 className="font-semibold mb-3">Os teus tickets</h3>
      <div className="space-y-2">
        {tickets?.length === 0 ? (
          <Card className="text-sm text-slate-500">Sem tickets abertos.</Card>
        ) : (
          tickets?.map((t) => (
            <Card key={t.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.subject}</div>
                <div className="text-xs text-slate-500">
                  {new Date(t.created_at).toLocaleString("pt-BR")} · prioridade {t.priority}
                </div>
              </div>
              <StatusPill status={t.status} />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
