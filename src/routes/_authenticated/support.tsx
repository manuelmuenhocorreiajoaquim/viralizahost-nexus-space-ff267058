import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { HelpCircle, MessageCircle, BookOpen, Loader2, Headphones } from "lucide-react";
import { Card, StatusPill } from "@/components/dashboard/ui";
import { CategoryBanner } from "@/components/dashboard/CategoryBanner";

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
      <CategoryBanner
        variant="support"
        icon={Headphones}
        eyebrow="Atendimento"
        title="Suporte"
        description="Estamos aqui para ajudar. Abre um ticket ou fala connosco no WhatsApp."
        actions={
          <button
            onClick={() => setOpen(!open)}
            className="px-4 py-2 rounded-lg bg-white text-blue-700 text-sm font-semibold hover:bg-white/90 btn-press"
          >
            Abrir ticket
          </button>
        }
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <Card className="card-hover animate-card-rise stagger-1">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-emerald-600" />
          </div>
          <h3 className="font-semibold mt-3">WhatsApp Suporte</h3>
          <p className="text-sm text-slate-500 mt-1">Atendimento rápido.</p>
          <a href="https://wa.me/244000000000" target="_blank" className="mt-3 inline-block text-sm text-emerald-600 hover:underline">
            Conversar →
          </a>
        </Card>
        <Card className="card-hover animate-card-rise stagger-2">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="font-semibold mt-3">Base de conhecimento</h3>
          <p className="text-sm text-slate-500 mt-1">Tutoriais e guias.</p>
        </Card>
        <Card className="card-hover animate-card-rise stagger-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-violet-600" />
          </div>
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
