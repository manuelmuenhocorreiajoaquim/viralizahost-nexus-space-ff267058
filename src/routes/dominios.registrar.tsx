import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Search, Sparkles, Shield, Zap } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import DomainSearchDialog from "@/components/site/DomainSearchDialog";
import { useCurrency, formatCurrency, convertCurrency } from "@/lib/currency";
import {
  useDomainExtensions,
  filterDomainsByCurrency,
} from "@/lib/use-domain-extensions";

export const Route = createFileRoute("/dominios/registrar")({
  head: () => ({
    meta: [
      { title: "Registrar Domínio — ViralizaHost" },
      {
        name: "description",
        content:
          "Pesquise e registre o domínio perfeito para sua marca. Extensões .com, .com.br, .ao, .co.ao, .net, .org com proteção WHOIS gratuita.",
      },
      { property: "og:title", content: "Registrar Domínio — ViralizaHost" },
      {
        property: "og:description",
        content: "Pesquise, registre e proteja sua identidade digital em segundos.",
      },
    ],
  }),
  component: RegistrarPage,
});



const benefits = [
  { icon: Shield, title: "Proteção WHOIS grátis", desc: "Privacidade total dos seus dados pessoais." },
  { icon: Zap, title: "Ativação instantânea", desc: "Domínio ativo em poucos minutos após o pagamento." },
  { icon: Sparkles, title: "DNS premium", desc: "Gestão completa de DNS no painel da ViralizaHost." },
];

function RegistrarPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { currency, rates } = useCurrency();
  const { data: extensions } = useDomainExtensions();
  const visible = filterDomainsByCurrency(extensions, currency);


  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(true);
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
              <Globe className="h-3.5 w-3.5" /> Registrar Domínio
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Encontre o domínio <span className="text-gradient-primary">perfeito</span> para a sua marca
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pesquise disponibilidade em tempo real e registre seu domínio em segundos.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={submit}
            className="max-w-3xl mx-auto mb-14"
          >
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/40 via-indigo-500/40 to-purple-500/40 opacity-0 group-focus-within:opacity-100 blur transition" />
              <div className="relative flex flex-col sm:flex-row gap-3 p-2 rounded-2xl bg-card shadow-elegant border border-border">
                <div className="flex items-center gap-3 flex-1 px-4">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 grid place-items-center shadow-md shrink-0">
                    <Globe className="h-4 w-4 text-white" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="suamarca"
                    className="flex-1 bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] transition-all"
                >
                  <Search className="h-4 w-4" /> Pesquisar Domínio
                </button>
              </div>
            </div>
          </motion.form>

          <DomainSearchDialog open={open} onOpenChange={setOpen} query={query} />

          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-6">Extensões populares</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {getVisibleExt(currency).map((d, i) => (
                <motion.div
                  key={d.ext}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className={`relative rounded-2xl bg-card p-5 text-center border transition-all hover:-translate-y-1 hover:shadow-glow-soft ${
                    d.popular ? "border-primary/40 shadow-glow-soft" : "border-border"
                  }`}
                >
                  {d.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-gradient-primary text-primary-foreground text-[10px] font-bold">
                      MAIS POPULAR
                    </div>
                  )}
                  <div className="text-2xl font-display font-bold text-gradient-primary">{d.ext}</div>
                  <div className="mt-2 text-sm">
                    <span className="font-bold text-foreground">
                      {formatCurrency(convertCurrency(getDomainPriceBRL(d.ext), currency, rates), currency)}
                    </span>
                    <span className="text-muted-foreground">/ano</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-2xl bg-card border border-border p-6"
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center shadow-glow-soft mb-4">
                  <b.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-1.5">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <CTAFooter />
    </div>
  );
}
