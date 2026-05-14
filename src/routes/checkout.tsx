import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronRight, ShoppingCart, Globe, Mail, User, CreditCard, PartyPopper,
  Trash2, Plus, Minus, ArrowRight, ArrowLeft, Lock, Sparkles, Loader2,
  QrCode, FileText, ShieldCheck, BadgeCheck, Zap,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import logo from "@/assets/viraliza-checkout-logo.png";
import { useCart, lineMonthly, CATALOG } from "@/lib/cart";
import { CYCLES, findCycle, findProduct, cyclePeriodTotal, cycleSavings, type CycleId } from "@/lib/catalog";
import { useCurrency, formatPrice } from "@/lib/currency";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import PixPaymentDialog from "@/components/checkout/PixPaymentDialog";
import { createCheckoutOrder } from "@/lib/payments.functions";

const STEPS = [
  { id: "cycle", label: "Ciclo", icon: Sparkles },
  { id: "cart", label: "Carrinho", icon: ShoppingCart },
  { id: "domain", label: "Domínio", icon: Globe },
  { id: "email", label: "Email", icon: Mail },
  { id: "auth", label: "Identificação", icon: User },
  { id: "payment", label: "Pagamento", icon: CreditCard },
  { id: "done", label: "Confirmação", icon: PartyPopper },
] as const;
type StepId = typeof STEPS[number]["id"];

const searchSchema = z.object({
  step: z.enum(["cycle", "cart", "domain", "email", "auth", "payment", "done"]).optional(),
  product: z.string().optional(),
  order: z.string().optional(),
});

export const Route = createFileRoute("/checkout")({
  validateSearch: (s) => searchSchema.parse(s),
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — ViralizaHost" }] }),
});

function brl(n: number, currency: "BRL" | "AKZ") {
  return formatPrice(`R$ ${Math.round(n)}`, currency);
}

const CHECKOUT_CUSTOMER_KEY = "vh.checkout.customer.v1";

function readCheckoutCustomer(): { name?: string; email?: string } {
  try {
    const parsed = JSON.parse(localStorage.getItem(CHECKOUT_CUSTOMER_KEY) ?? "{}");
    return {
      name: typeof parsed.name === "string" ? parsed.name : undefined,
      email: typeof parsed.email === "string" ? parsed.email : undefined,
    };
  } catch {
    return {};
  }
}

function CheckoutPage() {
  const search = useSearch({ from: "/checkout" });
  const navigate = useNavigate();
  const cart = useCart();
  const step: StepId = search.step ?? "cycle";

  useEffect(() => {
    if (search.product && !cart.items.some((i) => i.productId === search.product)) {
      cart.add(search.product);
      navigate({ to: "/checkout", search: { step: "cycle" }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goto = (s: StepId) => navigate({ to: "/checkout", search: { step: s } });

  return (
    <div
      className="min-h-screen text-foreground relative"
      style={{
        background:
          "radial-gradient(1100px 600px at 85% -10%, rgba(99,102,241,0.10), transparent 60%), radial-gradient(900px 500px at -10% 10%, rgba(59,130,246,0.10), transparent 55%), linear-gradient(180deg, #F8FAFC 0%, #EEF2F7 100%)",
      }}
    >
      <header className="border-b border-slate-200/70 bg-white/75 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            <img src={logo} alt="ViralizaHost" className="h-[44px] w-auto object-contain transition-transform group-hover:scale-105" />
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
            <ShieldCheck className="h-4 w-4" /> Compra 100% segura
          </div>
        </div>
      </header>

      <Stepper current={step} />

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {step === "cycle" && <CycleStep onNext={() => goto("cart")} />}
            {step === "cart" && <CartStep onBack={() => goto("cycle")} onNext={() => goto("domain")} />}
            {step === "domain" && <DomainStep onBack={() => goto("cart")} onNext={() => goto("email")} />}
            {step === "email" && <EmailStep onBack={() => goto("domain")} onNext={() => goto("auth")} />}
            {step === "auth" && <AuthStep onBack={() => goto("email")} onNext={() => goto("payment")} />}
            {step === "payment" && <PaymentStep onBack={() => goto("auth")} onDone={(orderId) => navigate({ to: "/checkout", search: { step: "done", order: orderId } })} />}
            {step === "done" && <DoneStep orderId={search.order} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Stepper({ current }: { current: StepId }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  const progress = (idx / (STEPS.length - 1)) * 100;
  return (
    <div className="border-b border-slate-200/70 bg-white/50 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-5">
        {/* progress bar */}
        <div className="relative h-1.5 rounded-full bg-slate-200/70 mb-4 overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-primary shadow-glow-soft"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <ol className="flex items-center gap-2 min-w-max overflow-x-auto">
          {STEPS.map((s, i) => {
            const done = i < idx;
            const active = i === idx;
            const Icon = s.icon;
            return (
              <li key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                  active ? "bg-gradient-primary text-primary-foreground shadow-glow-soft scale-[1.03]" :
                  done ? "bg-white text-slate-700 border border-slate-200" : "bg-white/60 text-slate-400 border border-slate-200/60"
                }`}>
                  <span className={`grid place-items-center h-5 w-5 rounded-full ${done ? "bg-emerald-500 text-white" : active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-400"}`}>
                    {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  </span>
                  <span className="hidden sm:inline">{i + 1}. {s.label}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-slate-300" />}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* ====================== STEP 1 — CYCLE ====================== */
function CycleStep({ onNext }: { onNext: () => void }) {
  const cart = useCart();
  const { currency } = useCurrency();
  const refBase = cart.items[0] ? findProduct(cart.items[0].productId)?.basePriceBRL ?? 50 : 50;

  return (
    <div>
      <Header title="Escolha sua assinatura" subtitle="Quanto maior o ciclo, maior o desconto. Sem fidelidade obrigatória." />
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {CYCLES.map((c) => {
          const monthly = refBase * (1 - c.discountPct / 100);
          const total = cyclePeriodTotal(refBase, c);
          const save = cycleSavings(refBase, c);
          const active = cart.cycle === c.id;
          return (
            <motion.button
              key={c.id}
              whileHover={{ y: -4 }}
              onClick={() => cart.setCycle(c.id)}
              className={`text-left rounded-2xl p-5 border transition-all relative bg-white ${
                active ? "border-primary shadow-glow ring-1 ring-primary/30" : "border-slate-200 shadow-card hover:shadow-glow-soft hover:border-slate-300"
              }`}
            >
              {c.badge && (
                <div className="absolute -top-2 right-4 px-2 py-0.5 rounded-full bg-gradient-primary text-[10px] font-bold text-primary-foreground shadow-glow-soft">
                  {c.badge}
                </div>
              )}
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{c.label}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-gradient-primary">{brl(monthly, currency)}</span>
                <span className="text-xs text-slate-500">/mês</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div>Total: <span className="font-semibold text-slate-900">{brl(total, currency)}</span></div>
                {save > 0 && <div className="text-emerald-600 font-medium">Economize {brl(save, currency)}</div>}
                <div className="text-slate-400">Renova em {c.months}m pelo mesmo valor</div>
              </div>
              {active && (
                <div className="mt-3 flex items-center gap-1 text-xs text-primary font-semibold">
                  <Check className="h-3 w-3" /> Selecionado
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
      <Footer onNext={onNext} nextLabel="Continuar" />
    </div>
  );
}

/* ====================== STEP 2 — CART ====================== */
function CartStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const cart = useCart();
  const { currency } = useCurrency();
  const [showAdd, setShowAdd] = useState(false);

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingCart className="h-12 w-12 mx-auto text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h2>
        <p className="text-slate-500 mb-6">Escolha um plano na página inicial para começar.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow">
          Ver planos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Header title="Seu carrinho" subtitle="Revise os serviços antes de continuar." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((it) => {
            const p = findProduct(it.productId);
            if (!p) return null;
            const monthly = lineMonthly(it.productId, cart.cycle);
            const total = monthly * findCycle(cart.cycle).months * it.qty;
            return (
              <div key={it.productId} className="rounded-2xl border border-slate-200 bg-white shadow-card p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-primary grid place-items-center shrink-0 shadow-glow-soft">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{p.type} · {brl(monthly, currency)}/mês</div>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                  <button onClick={() => cart.setQty(it.productId, it.qty - 1)} className="h-7 w-7 grid place-items-center rounded-full hover:bg-white"><Minus className="h-3 w-3" /></button>
                  <span className="w-6 text-center text-sm font-semibold">{it.qty}</span>
                  <button onClick={() => cart.setQty(it.productId, it.qty + 1)} className="h-7 w-7 grid place-items-center rounded-full hover:bg-white"><Plus className="h-3 w-3" /></button>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900">{brl(total, currency)}</div>
                  <button onClick={() => cart.remove(it.productId)} className="text-xs text-slate-400 hover:text-red-500 inline-flex items-center gap-1 mt-1">
                    <Trash2 className="h-3 w-3" /> Remover
                  </button>
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowAdd((v) => !v)} className="w-full py-3 rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 hover:bg-white hover:border-primary/40 hover:text-primary transition">
            <Plus className="h-4 w-4 inline mr-1" /> Adicionar outro serviço
          </button>
          {showAdd && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto shadow-card">
              {CATALOG.filter((p) => !cart.items.some((i) => i.productId === p.id)).map((p) => (
                <button key={p.id} onClick={() => { cart.add(p.id); setShowAdd(false); }} className="text-left p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{p.type} · {brl(p.basePriceBRL, currency)}/mês</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <Summary />
      </div>
      <Footer onBack={onBack} onNext={onNext} />
    </div>
  );
}

/* ====================== STEP 3 — DOMAIN ====================== */
function DomainStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const cart = useCart();
  const hostingItems = cart.items.filter((i) => findProduct(i.productId)?.needsDomain);

  if (hostingItems.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="h-10 w-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">Nenhum serviço requer domínio. Avançar para a próxima etapa.</p>
        <Footer onBack={onBack} onNext={onNext} />
      </div>
    );
  }

  return (
    <div>
      <Header title="Configure seu domínio" subtitle="Para cada hospedagem escolha registar um novo domínio ou usar um existente." />
      <div className="space-y-4 max-w-3xl">
        {hostingItems.map((it) => {
          const p = findProduct(it.productId)!;
          return <DomainPicker key={it.productId} name={p.name} value={it.domain ?? ""} onChange={(v) => cart.setDomain(it.productId, v)} />;
        })}
      </div>
      <Footer onBack={onBack} onNext={onNext} />
    </div>
  );
}

function DomainPicker({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  const [mode, setMode] = useState<"new" | "existing" | "later">(value ? "existing" : "new");
  const [domain, setDomain] = useState(value);
  useEffect(() => { onChange(domain); }, [domain]); // eslint-disable-line

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card p-5">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">Para</div>
      <div className="font-semibold mb-4 text-slate-900">{name}</div>
      <div className="grid sm:grid-cols-3 gap-2 mb-4">
        {(["new", "existing", "later"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)}
            className={`p-3 rounded-xl border text-sm font-medium transition ${
              mode === m ? "border-primary bg-primary/5 text-primary" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}>
            {m === "new" ? "Registar novo" : m === "existing" ? "Já tenho" : "Decidir depois"}
          </button>
        ))}
      </div>
      {mode !== "later" && (
        <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="meudominio.com"
          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white outline-none transition" />
      )}
    </div>
  );
}

/* ====================== STEP 4 — EMAIL UPSELL ====================== */
function EmailStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const cart = useCart();
  const { currency } = useCurrency();
  const has = cart.items.some((i) => findProduct(i.productId)?.type === "email");
  const emailPlans = CATALOG.filter((p) => p.type === "email");

  return (
    <div>
      <Header title="Adicione e-mail profissional" subtitle="Caixas com seu domínio (você@suaempresa.com), antispam e IA." />
      {has ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
          <Check className="h-4 w-4 inline mr-2" /> Você já tem um plano de e-mail no carrinho.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {emailPlans.map((p, i) => (
            <button key={p.id} onClick={() => cart.add(p.id)}
              className={`text-left rounded-2xl border p-5 transition bg-white ${
                i === 1 ? "border-primary shadow-glow ring-1 ring-primary/20" : "border-slate-200 shadow-card hover:border-slate-300 hover:shadow-glow-soft"
              }`}>
              <div className="font-bold text-lg text-slate-900">{p.name}</div>
              <div className="mt-2 text-2xl font-bold text-gradient-primary">{brl(p.basePriceBRL, currency)}<span className="text-xs text-slate-500 font-normal">/mês</span></div>
              <div className="mt-4 inline-flex items-center gap-1 text-xs text-primary font-semibold">
                <Plus className="h-3 w-3" /> Adicionar ao pedido
              </div>
            </button>
          ))}
        </div>
      )}
      <div className="mt-6 text-sm text-slate-500">Não precisa? Pule esta etapa.</div>
      <Footer onBack={onBack} onNext={onNext} nextLabel={has ? "Continuar" : "Pular e continuar"} />
    </div>
  );
}

/* ====================== STEP 5 — AUTH ====================== */
function AuthStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) {
    return (
      <div>
        <Header title="Identificação" />
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 max-w-md">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center shadow-glow-soft"><User className="h-5 w-5 text-primary-foreground" /></div>
            <div>
              <div className="font-semibold text-slate-900">{user.email}</div>
              <div className="text-xs text-emerald-700">Sessão ativa</div>
            </div>
          </div>
        </div>
        <Footer onBack={onBack} onNext={onNext} />
      </div>
    );
  }

  const submit = async () => {
    setLoading(true);
    try {
      localStorage.setItem(CHECKOUT_CUSTOMER_KEY, JSON.stringify({ name, email }));
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/checkout?step=auth", data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Conta criada!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado!");
      }
      onNext();
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Identifique-se" subtitle="Crie sua conta ou faça login para finalizar o pedido." />
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white shadow-card p-6">
        <div className="flex bg-slate-100 rounded-full p-1 mb-5">
          {(["signup", "login"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${mode === m ? "bg-gradient-primary text-primary-foreground shadow-glow-soft" : "text-slate-500"}`}>
              {m === "signup" ? "Criar conta" : "Entrar"}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {mode === "signup" && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white outline-none transition" />
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white outline-none transition" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white outline-none transition" />
          <button onClick={submit} disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signup" ? "Criar conta" : "Entrar"}
          </button>
        </div>
      </div>
      <Footer onBack={onBack} />
    </div>
  );
}

/* ====================== STEP 6 — PAYMENT ====================== */
function PaymentStep({ onBack, onDone }: { onBack: () => void; onDone: (orderId: string) => void }) {
  const cart = useCart();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const createOrderFn = useServerFn(createCheckoutOrder);
  const [method, setMethod] = useState<"pix" | "card" | "boleto">("pix");
  const [loading, setLoading] = useState(false);
  const [pixOrderId, setPixOrderId] = useState<string | null>(null);
  const [pixCustomerEmail, setPixCustomerEmail] = useState<string | undefined>();
  const [pixOpen, setPixOpen] = useState(false);

  const submit = async () => {
    console.log("cart", cart);
    console.log("user", user);
    if (cart.items.length === 0) { toast.error("Carrinho vazio."); return; }
    if (method !== "pix") {
      toast.info("Cartão e boleto serão liberados em breve. Use PIX por enquanto.");
      return;
    }
    const total = Number(Number(cart.totals.total).toFixed(2));
    if (!Number.isFinite(total) || total <= 0) {
      toast.error("Total do pedido inválido. Revise seu carrinho.");
      return;
    }

    setLoading(true);
    try {
      const customer = readCheckoutCustomer();
      if (!user?.id && !customer.email) {
        throw new Error("Informe um email válido na etapa Identificação.");
      }
      const c = findCycle(cart.cycle);
      const items = cart.items.map((it) => {
        const p = findProduct(it.productId);
        if (!p?.id || !p.name || !p.type) throw new Error("Item inválido no carrinho.");
        const quantity = Number(it.qty);
        const price = Number(lineMonthly(it.productId, cart.cycle).toFixed(2));
        if (!Number.isFinite(price) || price < 0 || !Number.isFinite(quantity) || quantity <= 0) {
          throw new Error("Item inválido no carrinho.");
        }
        return {
          id: p.id,
          name: p.name,
          type: p.type,
          price,
          quantity,
          domain: it.domain ?? null,
          total: Number((price * c.months * quantity).toFixed(2)),
        };
      });

      const order = await createOrderFn({ data: {
        cycle: cart.cycle,
        currency: "BRL",
        subtotal: Number(Number(cart.totals.subtotal).toFixed(2)),
        discount: Number(Number(cart.totals.discount).toFixed(2)),
        total,
        paymentMethod: "pix",
        paymentProvider: "mercadopago",
        customerEmail: user?.email ?? customer.email,
        customerName: customer.name,
        items,
      } });
      console.log("order", order);
      if (!order?.orderId) {
        throw new Error("Não foi possível criar o pedido. Tente novamente.");
      }

      setPixOrderId(order.orderId);
      setPixCustomerEmail(user?.email ?? customer.email);
      setPixOpen(true);
    } catch (e: any) {
      console.error("[checkout] submit error", e);
      const msg = typeof e?.message === "string" && e.message.length < 240
        ? e.message
        : "Não foi possível gerar o PIX. Verifique os dados e tente novamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onApproved = () => {
    if (!pixOrderId) return;
    cart.clear();
    // Small delay so user sees the "approved" state.
    setTimeout(() => {
      setPixOpen(false);
      onDone(pixOrderId);
    }, 1200);
  };

  return (
    <div>
      <Header title="Pagamento" subtitle="Escolha como quer pagar — rápido, seguro e processado pelo Mercado Pago." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {[
            { id: "pix" as const, label: "Pix", desc: "Aprovação imediata · Mercado Pago", Icon: QrCode, tint: "from-emerald-500 to-teal-500", available: true },
            { id: "card" as const, label: "Cartão de crédito", desc: "Em breve · Visa, Mastercard, Elo", Icon: CreditCard, tint: "from-indigo-500 to-blue-500", available: false },
            { id: "boleto" as const, label: "Boleto bancário", desc: "Em breve · 1–2 dias úteis", Icon: FileText, tint: "from-slate-500 to-slate-700", available: false },
          ].map((m) => {
            const selected = method === m.id;
            return (
              <motion.button
                key={m.id}
                whileHover={{ y: -2 }}
                onClick={() => setMethod(m.id)}
                className={`w-full text-left p-5 rounded-2xl border transition-all bg-white relative overflow-hidden ${
                  selected ? "border-primary ring-2 ring-primary/20 shadow-glow-soft" : "border-slate-200 shadow-card hover:border-slate-300"
                } ${!m.available ? "opacity-70" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${m.tint} grid place-items-center text-white shadow-md shrink-0`}>
                    <m.Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-900">{m.label}</div>
                      {m.id === "pix" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                          <Zap className="h-3 w-3" /> Recomendado
                        </span>
                      )}
                      {!m.available && (
                        <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-semibold">Em breve</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.desc}</div>
                  </div>
                  <div className={`h-5 w-5 rounded-full border-2 transition ${selected ? "border-primary bg-primary ring-4 ring-primary/15" : "border-slate-300"}`} />
                </div>
              </motion.button>
            );
          })}

          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-xs text-emerald-800 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900 text-[13px]">Compra 100% segura</div>
                Criptografia SSL 256-bit · Dados nunca tocam o nosso servidor
              </div>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 text-xs text-sky-900 flex items-start gap-3">
              <BadgeCheck className="h-5 w-5 shrink-0 mt-0.5 text-sky-600" />
              <div>
                <div className="font-bold text-[13px]">Processado por Mercado Pago</div>
                Mais de 100 milhões de transações por mês na América Latina
              </div>
            </div>
          </div>
        </div>
        <Summary>
          <motion.button
            whileHover={{ scale: loading || method !== "pix" ? 1 : 1.02 }}
            whileTap={{ scale: loading || method !== "pix" ? 1 : 0.98 }}
            onClick={submit}
            disabled={loading || method !== "pix"}
            className="w-full mt-4 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow text-[15px] tracking-tight"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
            {loading ? "A gerar PIX…" : "Gerar PIX"} {!loading && <ArrowRight className="h-4 w-4" />}
          </motion.button>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <Lock className="h-3 w-3" /> Pagamento criptografado
          </div>
        </Summary>
      </div>
      <Footer onBack={onBack} />

      <PixPaymentDialog
        open={pixOpen}
        onOpenChange={setPixOpen}
        orderId={pixOrderId}
        customerEmail={pixCustomerEmail}
        onApproved={onApproved}
      />
    </div>
  );
}

/* ====================== STEP 7 — DONE ====================== */
function DoneStep({ orderId }: { orderId?: string }) {
  const [status, setStatus] = useState<"provisioning" | "ready" | "error" | "idle">(
    orderId ? "provisioning" : "idle",
  );
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    let tries = 0;
    const poll = async () => {
      const { data } = await supabase
        .from("orders")
        .select("provisioned, provisioning_error")
        .eq("id", orderId)
        .single();
      if (cancelled) return;
      if (data?.provisioned) {
        setStatus("ready");
      } else if (data?.provisioning_error && tries > 1) {
        setStatus("error");
        setErrors(data.provisioning_error.split("\n").filter(Boolean));
      } else if (tries++ < 20) {
        setTimeout(poll, 2000);
      } else {
        setStatus("idle");
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [orderId]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto text-center py-12">
      <div className="h-20 w-20 mx-auto rounded-full bg-gradient-primary grid place-items-center shadow-glow mb-6">
        <PartyPopper className="h-10 w-10 text-primary-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2 text-slate-900">Pagamento aprovado!</h1>
      {status === "provisioning" && (
        <p className="text-slate-600 mb-2 inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> A provisionar a sua hospedagem cPanel…
        </p>
      )}
      {status === "ready" && (
        <p className="text-emerald-600 font-semibold mb-2">
          ✓ Hospedagem activa e pronta a usar
        </p>
      )}
      {status === "error" && (
        <div className="text-left bg-amber-50 border border-amber-200 rounded-xl p-4 my-4 text-sm text-amber-800">
          <div className="font-semibold mb-1">Provisionamento incompleto</div>
          <ul className="list-disc pl-4 space-y-0.5">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
          <p className="mt-2">A nossa equipa foi notificada e activará a sua conta manualmente.</p>
        </div>
      )}
      {status === "idle" && (
        <p className="text-slate-600 mb-2">Recebemos seu pedido e a equipa irá ativar os serviços.</p>
      )}
      {orderId && <p className="text-xs text-slate-400 mb-8">Nº do pedido: <span className="font-mono">{orderId.slice(0, 8)}</span></p>}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow">
          Ir para o painel <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50">
          Voltar ao site
        </Link>
      </div>
    </motion.div>
  );
}

/* ====================== SHARED ====================== */
function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      {subtitle && <p className="text-slate-600 mt-2">{subtitle}</p>}
    </div>
  );
}

function Footer({ onBack, onNext, nextLabel = "Continuar" }: { onBack?: () => void; onNext?: () => void; nextLabel?: string }) {
  return (
    <div className="mt-10 flex items-center justify-between gap-3">
      {onBack ? (
        <button onClick={onBack} className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm text-slate-600 hover:text-slate-900 hover:bg-white transition">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      ) : <span />}
      {onNext && (
        <button onClick={onNext} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-[1.02] transition">
          {nextLabel} <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function Summary({ children }: { children?: React.ReactNode }) {
  const cart = useCart();
  const { currency } = useCurrency();
  const c = findCycle(cart.cycle);
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white shadow-card p-6 h-fit sticky top-24">
      <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">Resumo · {c.label}</div>
      <div className="space-y-2 text-sm mb-4 max-h-48 overflow-y-auto">
        {cart.items.map((it) => {
          const p = findProduct(it.productId);
          if (!p) return null;
          const total = lineMonthly(it.productId, cart.cycle) * c.months * it.qty;
          return (
            <div key={it.productId} className="flex justify-between gap-2">
              <span className="text-slate-700 truncate">{p.name} ×{it.qty}</span>
              <span className="font-semibold text-slate-900 shrink-0">{brl(total, currency)}</span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-200 pt-3 space-y-1.5 text-sm">
        <Row label="Subtotal" value={brl(cart.totals.subtotal, currency)} />
        {cart.totals.discount > 0 && <Row label="Desconto" value={`- ${brl(cart.totals.discount, currency)}`} highlight />}
        <Row label="Total" value={brl(cart.totals.total, currency)} bold />
      </div>
      {children}
    </aside>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold text-slate-900" : ""} ${highlight ? "text-emerald-600" : ""}`}>
      <span className={bold ? "" : "text-slate-500"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
