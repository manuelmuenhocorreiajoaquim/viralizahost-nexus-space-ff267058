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
      <div
        className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        style={{
          backgroundImage: `url(${supportImg})`,
          backgroundAttachment: "fixed",
          backgroundPosition: "center right",
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#0B2A55",
        }}
      >
        {/* Gradient overlays for premium depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#050b1f]/85 via-[#0b1f55]/55 to-[#1a2b6b]/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.35),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(29,155,255,0.25),transparent_55%)]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10">
          <img src={logo} alt="ViralizaHost" className="h-12 w-auto object-contain drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Suporte humano 24/7 · Resposta em minutos
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight drop-shadow-lg">
            Suporte premium <br />
            <span className="bg-gradient-to-r from-sky-300 to-blue-100 bg-clip-text text-transparent">
              que faz a diferença.
            </span>
          </h2>
          <p className="text-white/80 max-w-md text-base leading-relaxed">
            Entra no teu painel ViralizaHost e gere hospedagens, domínios, e-mails
            e serviços digitais — com uma equipa real ao teu lado, sempre.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md pt-4">
            {[
              { v: "99.9%", l: "Uptime" },
              { v: "<2min", l: "Resposta" },
              { v: "+10k", l: "Clientes" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/10 backdrop-blur-md border border-white/15 p-3 text-center">
                <div className="text-lg font-bold text-white">{s.v}</div>
                <div className="text-[11px] uppercase tracking-wider text-white/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/60">
          © ViralizaHost · Premium hosting & digital services
        </p>
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
