import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/change-password")({
  component: Page,
});

function Page() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("A senha deve ter pelo menos 8 caracteres");
    if (pw !== pw2) return toast.error("As senhas não coincidem");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setLoading(false);
      return toast.error(error.message);
    }
    if (user) {
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", user.id);
    }
    setLoading(false);
    toast.success("Senha alterada com sucesso");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="max-w-md mx-auto">
      <PageHeader
        title="Alterar palavra-passe"
        subtitle="Por segurança, define uma nova palavra-passe antes de continuar."
      />
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nova palavra-passe</label>
            <input
              type="password"
              required
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600"
              minLength={8}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Confirmar palavra-passe</label>
            <input
              type="password"
              required
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600"
              minLength={8}
            />
          </div>
          <button
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Guardar nova senha
          </button>
        </form>
      </Card>
    </div>
  );
}
