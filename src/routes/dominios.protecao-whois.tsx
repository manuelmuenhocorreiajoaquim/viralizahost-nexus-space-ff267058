import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, MailX, Eye, Lock, ShoppingCart } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import CTAFooter from "@/components/site/CTAFooter";
import { useCart } from "@/lib/cart";
import { findProduct } from "@/lib/catalog";
import { formatPrice, useCurrency } from "@/lib/currency";
import { toast } from "sonner";

export const Route = createFileRoute("/dominios/protecao-whois")({
  head: () => ({
    meta: [
      { title: "Proteção WHOIS — ViralizaHost" },
      {
        name: "description",
        content:
          "Proteja seus dados pessoais no registro público WHOIS. Reduza spam, evite fraudes e blinde sua marca por apenas R$ 29/ano.",
      },
      { property: "og:title", content: "Proteção WHOIS — ViralizaHost" },
      {
        property: "og:description",
        content: "Privacidade total dos seus dados de domínio com a ViralizaHost.",
      },
    ],
  }),
  component: WhoisPage,
});

const benefits = [
  { icon: Eye, title: "Privacidade dos dados", desc: "Seu nome, e-mail, telefone e endereço ficam ocultos no WHOIS público." },
  { icon: MailX, title: "Redução de spam", desc: "Acabe com mensagens indesejadas e tentativas de phishing direcionadas." },
  { icon: ShieldCheck, title: "Segurança da marca", desc: "Dificulte sequestro de domínio e ataques de engenharia social." },
  { icon: Lock, title: "Conformidade LGPD/GDPR", desc: "Dados pessoais protegidos por padrão segundo as melhores práticas." },
];

function WhoisPage() {
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const { add } = useCart();

  const activate = () => {
    const product = findProduct("whois-protection");
    if (!product) return;
    add(product.id, {
      name: product.name,
      type: "domain",
      priceBRL: product.basePriceBRL,
      billing: "annual",
      qty: 1,
    });
    toast.success("Proteção WHOIS adicionada ao carrinho");
    navigate({ to: "/checkout", search: { step: "cart" } });
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
              <Shield className="h-3.5 w-3.5" /> Privacidade WHOIS
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Proteja seus dados no <span className="text-gradient-primary">WHOIS</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              O WHOIS é o registro público que expõe os dados do titular de qualquer domínio.
              Com a Proteção WHOIS da ViralizaHost, suas informações pessoais ficam ocultas e
              substituídas por dados de privacidade.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-3xl mx-auto mb-14 rounded-3xl bg-gradient-to-br from-primary/15 via-card to-accent/15 border border-primary/30 p-8 text-center shadow-elegant"
          >
            <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-primary grid place-items-center shadow-glow mb-5">
              <ShieldCheck className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-sm text-muted-foreground">Apenas</div>
            <div className="text-4xl font-bold text-gradient-primary mt-1">
              {formatPrice("R$ 29", currency)}
              <span className="text-base font-medium text-muted-foreground">/ano</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
              Cobertura anual completa para um domínio. Renovação automática opcional.
            </p>
            <button
              onClick={activate}
              className="mt-6 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow-soft hover:scale-[1.02] transition-all"
            >
              <ShoppingCart className="h-4 w-4" /> Ativar Proteção WHOIS
            </button>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="rounded-2xl bg-card border border-border p-6 flex items-start gap-4"
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center shadow-glow-soft shrink-0">
                  <b.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1.5">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <CTAFooter />
    </div>
  );
}
