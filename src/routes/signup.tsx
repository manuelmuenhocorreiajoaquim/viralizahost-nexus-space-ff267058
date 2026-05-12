import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logo from "@/assets/viralizahost-logo.png";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Criar conta — ViralizaHost" }] }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "BR",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("As senhas não coincidem");
    if (form.password.length < 6) return toast.error("Senha deve ter no mínimo 6 caracteres");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: form.full_name, phone: form.phone, country: form.country },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifica o teu e-mail.");
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0b1220] text-white">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0b1220] via-[#0e1a3a] to-[#1a2b6b]">
        <img src={logo} alt="ViralizaHost" className="h-12 w-auto object-contain" />
        <div>
          <h2 className="text-4xl font-bold leading-tight">Cria a tua conta ViralizaHost.</h2>
          <p className="mt-3 text-white/70 max-w-md">
            Hospedagem, domínios, IA, marketing e audiovisual — geridos num painel premium.
          </p>
        </div>
        <p className="text-sm text-white/50">© ViralizaHost</p>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white text-slate-900">
        <form onSubmit={handle} className="w-full max-w-sm space-y-4">
          <div>
            <h1 className="text-2xl font-bold">Criar conta</h1>
            <p className="text-sm text-slate-500">É rápido e gratuito</p>
          </div>
          <Field label="Nome completo">
            <input required value={form.full_name} onChange={set("full_name")} className={inputCls} />
          </Field>
          <Field label="E-mail">
            <input type="email" required value={form.email} onChange={set("email")} className={inputCls} />
          </Field>
          <Field label="Telefone / WhatsApp">
            <input value={form.phone} onChange={set("phone")} className={inputCls} />
          </Field>
          <Field label="País">
            <select value={form.country} onChange={set("country")} className={inputCls}>
              <option value="BR">🇧🇷 Brasil</option>
              <option value="AO">🇦🇴 Angola</option>
            </select>
          </Field>
          <Field label="Senha">
            <input type="password" required value={form.password} onChange={set("password")} className={inputCls} />
          </Field>
          <Field label="Confirmar senha">
            <input type="password" required value={form.confirm} onChange={set("confirm")} className={inputCls} />
          </Field>
          <button
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Criar conta
          </button>
          <p className="text-center text-sm text-slate-500">
            Já tens conta?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 bg-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
