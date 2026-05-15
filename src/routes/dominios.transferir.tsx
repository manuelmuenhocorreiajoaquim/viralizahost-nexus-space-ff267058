import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Globe, KeyRound, CheckCircle2, Sparkles, Gift } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { toast } from "sonner";

export const Route = createFileRoute("/dominios/transferir")({
  head: () => ({
    meta: [
      { title: "Transferir Domínio — ViralizaHost" },
      {
        name: "description",
        content:
          "Transfira seu domínio para a ViralizaHost com migração gratuita, +1 ano de registro grátis e proteção WHOIS incluída.",
      },
      { property: "og:title", content: "Transferir Domínio — ViralizaHost" },
      {
        property: "og:description",
        content: "Migração gratuita e suporte completo na transferência do seu domínio.",
      },
    ],
  }),
  component: TransferirPage,
});

const steps = [
  { n: "1", title: "Desbloqueie no registrador atual", desc: "Acesse o painel do seu registrador atual e desbloqueie o domínio para transferência." },
  { n: "2", title: "Solicite o código EPP/Auth", desc: "Peça o código de autorização (EPP/Auth Code) — geralmente enviado por e-mail." },
  { n: "3", title: "Inicie a transferência aqui", desc: "Insira o domínio e o código abaixo. Cuidamos de todo o processo até a conclusão." },
];

const perks = [
  { icon: Gift, title: "+1 ano grátis", desc: "Você ganha um ano adicional ao transferir." },
  { icon: CheckCircle2, title: "Sem downtime", desc: "Seu site e e-mails continuam funcionando." },
  { icon: Sparkles, title: "WHOIS incluso", desc: "Proteção de privacidade gratuita no primeiro ano." },
];

function TransferirPage() {
  const [domain, setDomain] = useState("");
  const [epp, setEpp] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim() || !epp.trim()) {
      toast.error("Preencha o domínio e o código EPP/Auth.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(
        `Solicitação de transferência iniciada para ${domain.trim()}. Nossa equipe entrará em contato.`,
      );
      setDomain("");
      setEpp("");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <ArrowRight className="h-3.5 w-3.5" /> Transferir Domínio
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Mude seu domínio para a <span className="text-gradient-primary">ViralizaHost</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Migração gratuita, +1 ano de registro grátis e proteção WHOIS incluída.
              Sem complicações, sem downtime.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={submit}
            className="max-w-3xl mx-auto mb-16 rounded-3xl bg-card border border-border p-7 shadow-elegant"
          >
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" /> Domínio para transferir
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="exemplo.com"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" /> Código EPP / Auth Code
                </label>
                <input
                  type="text"
                  value={epp}
                  onChange={(e) => setEpp(e.target.value)}
                  placeholder="Cole aqui o código fornecido pelo registrador atual"
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border outline-none focus:border-primary transition font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Solicite o código EPP/Auth ao seu registrador atual. Ele garante a autorização da transferência.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow-soft hover:scale-[1.01] transition-all disabled:opacity-60"
              >
                {loading ? "Iniciando..." : (<><ArrowRight className="h-4 w-4" /> Iniciar transferência</>)}
              </button>
            </div>
          </motion.form>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {perks.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-2xl bg-card border border-border p-6 text-center"
              >
                <div className="h-11 w-11 mx-auto rounded-xl bg-gradient-primary grid place-items-center shadow-glow-soft mb-4">
                  <p.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-bold mb-1.5">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-border p-8">
            <h2 className="text-2xl font-bold text-center mb-8">Como funciona a transferência</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((s) => (
                <div key={s.n} className="relative">
                  <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground font-bold mb-4">
                    {s.n}
                  </div>
                  <h3 className="font-bold mb-1.5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <CTAFooter />
    </div>
  );
}
