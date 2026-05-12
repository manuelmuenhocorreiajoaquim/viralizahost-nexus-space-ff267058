import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logo from "@/assets/viralizahost-logo.png";
import supportImg from "@/assets/login-support.jpg";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Entrar — ViralizaHost" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0b1220] text-white">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0b1220] via-[#0e1a3a] to-[#1a2b6b]">
        <img src={logo} alt="ViralizaHost" className="h-12 w-auto object-contain" />
        <div>
          <h2 className="text-4xl font-bold leading-tight">Bem-vindo à sua área de cliente.</h2>
          <p className="mt-3 text-white/70 max-w-md">
            Gerencie hospedagens, domínios, e-mails e muito mais — tudo num só painel premium.
          </p>
        </div>
        <p className="text-sm text-white/50">© ViralizaHost · Premium hosting & digital services</p>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white text-slate-900">
        <form onSubmit={handle} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-bold">Entrar</h1>
            <p className="text-sm text-slate-500">Acede ao teu painel ViralizaHost</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>
          <button
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Entrar
          </button>
          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="text-blue-600 hover:underline">
              Esqueci minha senha
            </Link>
            <Link to="/signup" className="text-blue-600 hover:underline">
              Criar conta
            </Link>
          </div>
          <Link to="/" className="block text-center text-xs text-slate-400 hover:text-slate-600">
            ← Voltar ao site
          </Link>
        </form>
      </div>
    </div>
  );
}
