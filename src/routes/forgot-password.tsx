import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: Page,
  head: () => ({ meta: [{ title: "Recuperar senha — ViralizaHost" }] }),
});

function Page() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Verifica o teu e-mail para redefinir a senha.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <form onSubmit={handle} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Esqueci minha senha</h1>
          <p className="text-sm text-slate-500 mt-1">Enviaremos um link para o teu e-mail.</p>
        </div>
        <input
          type="email"
          required
          placeholder="teu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
        <button
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Enviar link
        </button>
        <Link to="/login" className="block text-center text-sm text-blue-600 hover:underline">
          ← Voltar ao login
        </Link>
      </form>
    </div>
  );
}
