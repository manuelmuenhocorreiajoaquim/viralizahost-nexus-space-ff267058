import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  ShoppingCart,
  Globe,
  Mail,
  User,
  CreditCard,
  PartyPopper,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Lock,
  Sparkles,
  Loader2,
  QrCode,
  FileText,
  ShieldCheck,
  BadgeCheck,
  Zap,
  Search,
  AlertTriangle,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import logo from "@/assets/viraliza-checkout-logo.png";
import { useCart, lineMonthly, lineTotal, lineUnit, CATALOG, isAnnualProduct } from "@/lib/cart";
import {
  CYCLES,
  findCycle,
  findProduct,
  cyclePeriodTotal,
  cycleSavings,
  productRequiresDomain,
  productNeedsCycle,
  isOneTimeService,
  type CycleId,
  type Product,
} from "@/lib/catalog";
import { useCurrency, formatPrice } from "@/lib/currency";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import PixPaymentDialog from "@/components/checkout/PixPaymentDialog";
import CardPaymentDialog from "@/components/checkout/CardPaymentDialog";
import BoletoPaymentDialog from "@/components/checkout/BoletoPaymentDialog";
import PayPalPaymentDialog from "@/components/checkout/PayPalPaymentDialog";
import BankTransferDialog from "@/components/checkout/BankTransferDialog";
import bicLogoImg from "@/assets/banco-bic-logo.png";
import DomainSearchDialog from "@/components/site/DomainSearchDialog";
import { createCheckoutOrder } from "@/lib/payments.functions";

/* Sanitize raw domain input → lowercase, no protocol/path/www/spaces. */
function sanitizeDomain(input: string): string {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}
/* Allow xn-- IDN, multi-level TLDs (.com.br, .co.ao). 2+ labels, valid chars. */
const DOMAIN_REGEX =
  /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)){1,3}$/;
function isValidDomain(d: string): boolean {
  return DOMAIN_REGEX.test(d) && /\.[a-z]{2,}$/.test(d);
}

const STEPS = [
  { id: "cycle", label: "Ciclo", icon: Sparkles },
  { id: "cart", label: "Carrinho", icon: ShoppingCart },
  { id: "domain", label: "Domínio", icon: Globe },
  { id: "email", label: "Email", icon: Mail },
  { id: "auth", label: "Identificação", icon: User },
  { id: "payment", label: "Pagamento", icon: CreditCard },
  { id: "done", label: "Confirmação", icon: PartyPopper },
] as const;
type StepId = (typeof STEPS)[number]["id"];

/** Compute which steps are relevant for the current cart contents. */
function computeActiveSteps(items: Array<{ productId: string }>): StepId[] {
  const products = items
    .map((i) => findProduct(i.productId))
    .filter((p): p is Product => Boolean(p));
  const hasCycleItem = products.some(productNeedsCycle);
  const hasDomainItem =
    products.some(productRequiresDomain) || products.some((p) => p.type === "domain");
  // Email upsell only makes sense if a hosting product is present and no email plan yet.
  const hasHosting = products.some((p) => p.type === "hosting");
  const hasEmail = products.some((p) => p.type === "email");
  const showEmailStep = hasHosting && !hasEmail;

  const out: StepId[] = [];
  if (hasCycleItem) out.push("cycle");
  out.push("cart");
  if (hasDomainItem) out.push("domain");
  if (showEmailStep) out.push("email");
  out.push("auth", "payment", "done");
  return out;
}

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

  const activeSteps = useMemo(() => computeActiveSteps(cart.items), [cart.items]);
  const initialStep: StepId = activeSteps[0] ?? "cart";
  const requestedStep: StepId = search.step ?? initialStep;
  // If user lands on a step that no longer applies (e.g. domain skipped), fall back.
  const step: StepId =
    requestedStep === "done"
      ? "done"
      : activeSteps.includes(requestedStep)
        ? requestedStep
        : initialStep;

  useEffect(() => {
    if (search.product && !cart.items.some((i) => i.productId === search.product)) {
      cart.add(search.product);
      navigate({ to: "/checkout", search: { step: undefined }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync if the step is no longer valid for the current cart.
  useEffect(() => {
    if (search.step && search.step !== "done" && !activeSteps.includes(search.step)) {
      navigate({ to: "/checkout", search: { step: initialStep }, replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSteps.join("|")]);

  const goto = (s: StepId) =>
    navigate({ to: "/checkout", search: { step: s, order: search.order } });

  const idx = activeSteps.indexOf(step);
  const next = (): StepId => activeSteps[Math.min(idx + 1, activeSteps.length - 1)] ?? step;
  const prev = (): StepId => activeSteps[Math.max(idx - 1, 0)] ?? step;
  const goNext = () => goto(next());
  const goBack = () => goto(prev());

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
            <img
              src={logo}
              alt="ViralizaHost"
              className="h-[44px] w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm">
            <ShieldCheck className="h-4 w-4" /> Compra 100% segura
          </div>
        </div>
      </header>

      <Stepper current={step} activeSteps={activeSteps} />

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            {step === "cycle" && <CycleStep onNext={goNext} />}
            {step === "cart" && <CartStep onBack={goBack} onNext={goNext} />}
            {step === "domain" && <DomainStep onBack={goBack} onNext={goNext} />}
            {step === "email" && <EmailStep onBack={goBack} onNext={goNext} />}
            {step === "auth" && <AuthStep onBack={goBack} onNext={goNext} />}
            {step === "payment" && (
              <PaymentStep
                onBack={goBack}
                onDone={(orderId) =>
                  navigate({ to: "/checkout", search: { step: "done", order: orderId } })
                }
              />
            )}
            {step === "done" && <DoneStep orderId={search.order} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Stepper({ current, activeSteps }: { current: StepId; activeSteps: StepId[] }) {
  const steps = STEPS.filter((s) => activeSteps.includes(s.id));
  const idx = steps.findIndex((s) => s.id === current);
  const progress = steps.length > 1 ? (idx / (steps.length - 1)) * 100 : 0;
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
          {steps.map((s, i) => {
            const done = i < idx;
            const active = i === idx;
            const Icon = s.icon;
            return (
              <li key={s.id} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? "bg-gradient-primary text-primary-foreground shadow-glow-soft scale-[1.03]"
                      : done
                        ? "bg-white text-slate-700 border border-slate-200"
                        : "bg-white/60 text-slate-400 border border-slate-200/60"
                  }`}
                >
                  <span
                    className={`grid place-items-center h-5 w-5 rounded-full ${done ? "bg-emerald-500 text-white" : active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-400"}`}
                  >
                    {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  </span>
                  <span className="hidden sm:inline">
                    {i + 1}. {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-slate-300" />}
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
  const recurringItems = cart.items.filter((i) => {
    const p = findProduct(i.productId);
    return p && !isAnnualProduct(p);
  });

  // Cart contains only annual products (domains) — skip cycle step.
  if (cart.items.length > 0 && recurringItems.length === 0) {
    return (
      <div>
        <Header
          title="Registro anual de domínio"
          subtitle="Domínios são cobrados anualmente — sem ciclo de assinatura."
        />
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 max-w-xl shadow-card">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center text-white shadow-md">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Apenas domínios no carrinho</div>
              <p className="text-sm text-slate-600 mt-1">
                Você pode prosseguir direto para a finalização. O preço do domínio é fixo por ano.
              </p>
            </div>
          </div>
        </div>
        <Footer onNext={onNext} nextLabel="Continuar" />
      </div>
    );
  }

  const refBase = recurringItems[0]
    ? (findProduct(recurringItems[0].productId)?.basePriceBRL ?? 50)
    : cart.items[0]
      ? (findProduct(cart.items[0].productId)?.basePriceBRL ?? 50)
      : 50;
  const maxDiscount = Math.max(...CYCLES.map((c) => c.discountPct), 1);

  return (
    <div>
      <Header
        title="Escolha sua assinatura"
        subtitle="Quanto maior o ciclo, maior o desconto. Sem fidelidade obrigatória. Domínios são cobrados anualmente."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
        {CYCLES.map((c, idx) => {
          const monthly = refBase * (1 - c.discountPct / 100);
          const total = cyclePeriodTotal(refBase, c);
          const save = cycleSavings(refBase, c);
          const active = cart.cycle === c.id;
          const pct = Math.round((c.discountPct / maxDiscount) * 100);
          const isBest = c.id === "annual";
          return (
            <motion.button
              key={c.id}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => cart.setCycle(c.id)}
              className={`group relative text-left rounded-2xl p-5 lg:p-6 border overflow-hidden transition-all duration-300 will-change-transform ${
                active
                  ? "border-primary/70 bg-white shadow-[0_20px_60px_-20px_oklch(0.62_0.22_255/0.55)] ring-2 ring-primary/30"
                  : "border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-card hover:shadow-glow-soft hover:border-primary/40"
              }`}
            >
              {/* Active gradient wash */}
              <div
                className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                  active ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  background:
                    "linear-gradient(160deg, oklch(0.62 0.22 255 / 0.10) 0%, transparent 55%, oklch(0.5 0.24 265 / 0.08) 100%)",
                }}
              />
              {/* Hover sheen */}
              <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                   style={{ background: "radial-gradient(600px circle at var(--x,50%) 0%, oklch(0.62 0.22 255 / 0.08), transparent 40%)" }} />

              {isBest && !active && (
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-bold uppercase tracking-wider shadow">
                  Mais popular
                </div>
              )}

              {c.badge && (
                <div className="absolute -top-2.5 right-4 px-3 py-1 rounded-full text-[10px] font-bold text-white shadow-lg tracking-wide"
                     style={{ background: "linear-gradient(135deg,#4f46e5 0%,#2563eb 50%,#0ea5e9 100%)", boxShadow: "0 8px 22px -6px rgba(37,99,235,.55)" }}>
                  {c.badge}
                </div>
              )}

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 font-semibold">
                    {c.label}
                  </div>
                  {active && (
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold"
                    >
                      <Check className="h-3 w-3" /> Selecionado
                    </motion.span>
                  )}
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {currency === "AKZ" ? "Kz" : "R$"}
                  </span>
                  <span className="text-[34px] leading-none font-extrabold tracking-tight text-slate-900 tabular-nums">
                    {brl(monthly, currency).replace(/^[^\d]+/, "")}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/mês</span>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Total</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{brl(total, currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Economia</span>
                    {save > 0 ? (
                      <span className="font-semibold text-emerald-600 tabular-nums">
                        {brl(save, currency)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: active
                          ? "linear-gradient(90deg, oklch(0.62 0.22 255), oklch(0.5 0.24 265))"
                          : "linear-gradient(90deg, #34d399, #059669)",
                        boxShadow: active
                          ? "0 0 12px oklch(0.62 0.22 255 / 0.55)"
                          : "0 0 8px rgba(16,185,129,.35)",
                      }}
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <div className="absolute inset-0 shimmer-bg opacity-40" />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Desconto</span>
                    <span className={active ? "text-primary font-bold" : ""}>
                      {c.discountPct}%
                    </span>
                  </div>
                </div>
              </div>
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
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow"
        >
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
            const annual = isAnnualProduct(p);
            const oneTime = isOneTimeService(p);
            const total = lineTotal(it.productId, cart.cycle, it.qty);
            const unit = lineUnit(it.productId, cart.cycle);
            const subLabel = oneTime
              ? `${p.type} · ${brl(unit, currency)} · projeto`
              : annual
                ? `${p.type} · ${brl(unit, currency)}/ano`
                : `${p.type} · ${brl(unit, currency)}/mês`;
            return (
              <div
                key={it.productId}
                className="rounded-2xl border border-slate-200 bg-white shadow-card p-5 flex items-center gap-4"
              >
                <div
                  className={`h-12 w-12 rounded-xl grid place-items-center shrink-0 shadow-glow-soft ${annual ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-primary"}`}
                >
                  {annual ? (
                    <Globe className="h-5 w-5 text-white" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 capitalize">{subLabel}</div>
                  {it.domain && !annual && (
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{it.domain}</div>
                  )}
                </div>
                {annual ? (
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                    Anual
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-slate-100 rounded-full p-1">
                    <button
                      onClick={() => cart.setQty(it.productId, it.qty - 1)}
                      className="h-7 w-7 grid place-items-center rounded-full hover:bg-white"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{it.qty}</span>
                    <button
                      onClick={() => cart.setQty(it.productId, it.qty + 1)}
                      className="h-7 w-7 grid place-items-center rounded-full hover:bg-white"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900">{brl(total, currency)}</div>
                  <button
                    onClick={() => cart.remove(it.productId)}
                    className="text-xs text-slate-400 hover:text-red-500 inline-flex items-center gap-1 mt-1"
                  >
                    <Trash2 className="h-3 w-3" /> Remover
                  </button>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="w-full py-3 rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500 hover:bg-white hover:border-primary/40 hover:text-primary transition"
          >
            <Plus className="h-4 w-4 inline mr-1" /> Adicionar outro serviço
          </button>
          {showAdd && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 grid sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto shadow-card">
              {CATALOG.filter(
                (p) => p.type !== "domain" && !cart.items.some((i) => i.productId === p.id),
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    cart.add(p.id);
                    setShowAdd(false);
                  }}
                  className="text-left p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                >
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500 capitalize">
                    {p.type} · {brl(p.basePriceBRL, currency)}/mês
                  </div>
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
  const { currency } = useCurrency();
  const itemsNeedingDomain = cart.items.filter((i) => findProduct(i.productId)?.needsDomain);
  const domainItemsOnly = cart.items.filter((i) => findProduct(i.productId)?.type === "domain");
  const hasDomainInCart = domainItemsOnly.length > 0;

  // Apenas e-mail profissional EXIGE domínio. Hospedagem/VPS é opcional.
  const itemsRequiringDomain = itemsNeedingDomain.filter(
    (i) => findProduct(i.productId)?.type === "email",
  );
  const allSatisfied = itemsRequiringDomain.every(
    (i) => Boolean(i.domain && i.domain.trim().length > 2) || hasDomainInCart,
  );
  const nextDisabled = itemsRequiringDomain.length > 0 && !allSatisfied;

  if (itemsNeedingDomain.length === 0 && domainItemsOnly.length === 0) {
    return (
      <div className="text-center py-12">
        <Globe className="h-10 w-10 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">
          Nenhum serviço requer domínio. Avançar para a próxima etapa.
        </p>
        <Footer onBack={onBack} onNext={onNext} />
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Configure seu domínio"
        subtitle="Todo serviço de hospedagem ou e-mail precisa de um domínio. Registre um novo ou utilize um que já tenha."
      />

      {/* Domínios já adicionados ao carrinho */}
      {domainItemsOnly.length > 0 && (
        <div className="mb-6 max-w-3xl space-y-3">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Domínios no pedido
          </div>
          {domainItemsOnly.map((it) => {
            const p = findProduct(it.productId)!;
            const total = lineTotal(it.productId, cart.cycle, it.qty);
            return (
              <motion.div
                key={it.productId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-blue-50 shadow-card p-4 flex items-center gap-4"
              >
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center text-white shadow-md shrink-0">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" /> Proteção WHOIS
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-500" /> Registro instantâneo
                    </span>
                    <span>· Registro anual</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-slate-500">Preço</div>
                  <div className="font-bold text-slate-900">
                    {brl(total, currency)}
                    <span className="text-[11px] font-medium text-slate-500">/ano</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {itemsNeedingDomain.length > 0 && (
        <div className="space-y-4 max-w-3xl">
          {itemsNeedingDomain.map((it) => {
            const p = findProduct(it.productId)!;
            const required = p.type === "email";
            return (
              <DomainPicker
                key={it.productId}
                name={p.name}
                value={it.domain ?? ""}
                onChange={(v) => cart.setDomain(it.productId, v)}
                hasDomainInCart={hasDomainInCart}
                domainInCart={domainItemsOnly[0]?.domain ?? domainItemsOnly[0]?.name}
                required={required}
              />
            );
          })}
        </div>
      )}
      <Footer
        onBack={onBack}
        onNext={onNext}
        nextDisabled={nextDisabled}
        nextHint="Adicione ou informe um domínio para todos os serviços."
      />
    </div>
  );
}

function DomainPicker({
  name,
  value,
  onChange,
  hasDomainInCart,
  domainInCart,
  required = true,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  hasDomainInCart?: boolean;
  domainInCart?: string;
  required?: boolean;
}) {
  type Mode = "new" | "existing" | "use-cart" | "skip";
  const initialMode: Mode =
    hasDomainInCart && !value ? "use-cart" : value ? "existing" : "new";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [raw, setRaw] = useState(value);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "ok"; domain: string }
    | { kind: "available"; domain: string }
    | { kind: "invalid"; message: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const cleaned = sanitizeDomain(raw);

  // Sync to parent: only push value when valid existing/use-cart, clear otherwise.
  useEffect(() => {
    if (mode === "use-cart" && domainInCart) {
      onChange(domainInCart);
    } else if (mode === "existing" && status.kind === "ok") {
      onChange(status.domain);
    } else {
      onChange("");
    }
  }, [mode, status, domainInCart]); // eslint-disable-line

  // Reset status when user edits or switches mode.
  useEffect(() => {
    setStatus({ kind: "idle" });
  }, [raw, mode]);

  const handleNewSearch = () => {
    if (!cleaned) {
      setStatus({ kind: "invalid", message: "Digite o domínio que deseja registrar." });
      return;
    }
    // Allow base name (without dot) or full domain — open dialog with sanitized base.
    const base = cleaned.split(".")[0];
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(base)) {
      setStatus({ kind: "invalid", message: "Nome inválido. Use apenas letras, números e hífen." });
      return;
    }
    setSearchQuery(base);
    setSearchOpen(true);
  };

  const handleExistingCheck = async () => {
    if (!cleaned) {
      setStatus({ kind: "invalid", message: "Informe o domínio que você já possui." });
      return;
    }
    if (!isValidDomain(cleaned)) {
      setStatus({
        kind: "invalid",
        message: "Formato inválido. Exemplo: meudominio.com, empresa.com.br, marca.ao",
      });
      return;
    }
    setChecking(true);
    try {
      const base = cleaned.split(".")[0];
      const { data, error } = await supabase.functions.invoke("domain-search", {
        body: { query: base },
      });
      if (error) throw error;
      const results: Array<{ domain: string; available: boolean }> = Array.isArray(data?.results)
        ? data.results
        : [];
      const match = results.find((r) => r.domain.toLowerCase() === cleaned);
      if (match && match.available) {
        setStatus({
          kind: "available",
          domain: cleaned,
        });
      } else {
        // Considered registered/taken (or unknown TLD) → accept.
        setStatus({ kind: "ok", domain: cleaned });
      }
    } catch (e) {
      console.error("[domain-check] failed", e);
      // Network/edge fail → accept domain optimistically; backend will validate at provisioning.
      setStatus({ kind: "ok", domain: cleaned });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-card p-5">
      <div className="text-xs text-slate-500 uppercase tracking-wider mb-1 font-semibold">
        Para
      </div>
      <div className="font-semibold mb-4 text-slate-900">{name}</div>
      <div className={`grid gap-2 mb-4 ${!required || hasDomainInCart ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {hasDomainInCart && (
          <button
            type="button"
            onClick={() => setMode("use-cart")}
            className={`p-3 rounded-xl border text-sm font-medium transition ${
              mode === "use-cart"
                ? "border-primary bg-primary/5 text-primary shadow-glow-soft"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            Usar do carrinho
          </button>
        )}
        <button
          type="button"
          onClick={() => setMode("new")}
          className={`p-3 rounded-xl border text-sm font-medium transition ${
            mode === "new"
              ? "border-primary bg-primary/5 text-primary shadow-glow-soft"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          Registrar novo
        </button>
        <button
          type="button"
          onClick={() => setMode("existing")}
          className={`p-3 rounded-xl border text-sm font-medium transition ${
            mode === "existing"
              ? "border-primary bg-primary/5 text-primary shadow-glow-soft"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
          }`}
        >
          Já tenho
        </button>
        {!required && !hasDomainInCart && (
          <button
            type="button"
            onClick={() => setMode("skip")}
            className={`p-3 rounded-xl border text-sm font-medium transition ${
              mode === "skip"
                ? "border-primary bg-primary/5 text-primary shadow-glow-soft"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            Continuar sem domínio
          </button>
        )}
      </div>

      {mode === "skip" ? (
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <Check className="h-4 w-4 inline mr-1 text-emerald-600" />
          Você pode adicionar um domínio depois, no painel. O serviço será provisionado com um endereço temporário.
        </div>
      ) : mode === "use-cart" && domainInCart ? (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium">
          <Check className="h-4 w-4 inline mr-1" /> Vinculado a <strong>{domainInCart}</strong>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  mode === "new" ? handleNewSearch() : handleExistingCheck();
                }
              }}
              placeholder={mode === "new" ? "minhamarca" : "meudominio.com"}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white outline-none transition"
            />
            <button
              type="button"
              onClick={mode === "new" ? handleNewSearch : handleExistingCheck}
              disabled={checking}
              className="inline-flex items-center gap-2 px-5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-glow-soft hover:scale-[1.02] transition disabled:opacity-60"
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "new" ? (
                <Search className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {mode === "new" ? "Pesquisar" : "Verificar"}
              </span>
            </button>
          </div>

          {status.kind === "ok" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 font-medium flex items-start gap-2"
            >
              <Check className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Domínio <strong>{status.domain}</strong> aceito. Será vinculado ao seu serviço sem
                custo adicional.
              </div>
            </motion.div>
          )}
          {status.kind === "available" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-start gap-2"
            >
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <strong>{status.domain}</strong> parece estar disponível para registro. Escolha{" "}
                <button
                  type="button"
                  className="underline font-semibold"
                  onClick={() => setMode("new")}
                >
                  Registrar novo
                </button>{" "}
                para comprá-lo, ou informe um domínio que você já possui.
              </div>
            </motion.div>
          )}
          {status.kind === "invalid" && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>{status.message}</div>
            </div>
          )}
          {mode === "new" && status.kind === "idle" && (
            <p className="text-xs text-slate-500">
              Digite o nome desejado e clique em <strong>Pesquisar</strong> para ver disponibilidade
              e preços oficiais.
            </p>
          )}
          {mode === "existing" && status.kind === "idle" && (
            <p className="text-xs text-slate-500">
              Informe o domínio completo (ex.: <code>minhaempresa.com</code>). Vamos verificar se
              já está registrado.
            </p>
          )}
        </div>
      )}

      <DomainSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        query={searchQuery}
      />
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
      <Header
        title="Adicione e-mail profissional"
        subtitle="Caixas com seu domínio (você@suaempresa.com), antispam e IA."
      />
      {has ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
          <Check className="h-4 w-4 inline mr-2" /> Você já tem um plano de e-mail no carrinho.
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {emailPlans.map((p, i) => (
            <button
              key={p.id}
              onClick={() => cart.add(p.id)}
              className={`text-left rounded-2xl border p-5 transition bg-white ${
                i === 1
                  ? "border-primary shadow-glow ring-1 ring-primary/20"
                  : "border-slate-200 shadow-card hover:border-slate-300 hover:shadow-glow-soft"
              }`}
            >
              <div className="font-bold text-lg text-slate-900">{p.name}</div>
              <div className="mt-2 text-2xl font-bold text-gradient-primary">
                {brl(p.basePriceBRL, currency)}
                <span className="text-xs text-slate-500 font-normal">/mês</span>
              </div>
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
            <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center shadow-glow-soft">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
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
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/checkout?step=auth",
            data: { full_name: name },
          },
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
      <Header
        title="Identifique-se"
        subtitle="Crie sua conta ou faça login para finalizar o pedido."
      />
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white shadow-card p-6">
        <div className="flex bg-slate-100 rounded-full p-1 mb-5">
          {(["signup", "login"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${mode === m ? "bg-gradient-primary text-primary-foreground shadow-glow-soft" : "text-slate-500"}`}
            >
              {m === "signup" ? "Criar conta" : "Entrar"}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {mode === "signup" && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white outline-none transition"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white outline-none transition"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:bg-white outline-none transition"
          />
          <button
            onClick={submit}
            disabled={loading || !email || !password}
            className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-glow"
          >
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
function PixBrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path fill="#32BCAD" d="M31.99 6.8 57.2 32 31.99 57.2 6.8 32 31.99 6.8Z" />
      <path
        fill="#fff"
        d="M22.1 24.2c2.7-2.7 7.1-2.7 9.8 0l2.1 2.1 2.1-2.1c2.7-2.7 7.1-2.7 9.8 0l5.5 5.5-3.7 3.7-5.5-5.5a1.8 1.8 0 0 0-2.5 0l-3.9 3.9a2.6 2.6 0 0 1-3.6 0l-3.9-3.9a1.8 1.8 0 0 0-2.5 0l-5.5 5.5-3.7-3.7 5.5-5.5Zm-5.5 10.1 3.7-3.7 5.5 5.5a1.8 1.8 0 0 0 2.5 0l3.9-3.9a2.6 2.6 0 0 1 3.6 0l3.9 3.9a1.8 1.8 0 0 0 2.5 0l5.5-5.5 3.7 3.7-5.5 5.5c-2.7 2.7-7.1 2.7-9.8 0L34 37.7l-2.1 2.1c-2.7 2.7-7.1 2.7-9.8 0l-5.5-5.5Z"
      />
    </svg>
  );
}

function MercadoPagoMark() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#E7F4FF] px-3 py-1.5 text-[#009EE3] ring-1 ring-[#009EE3]/20 shadow-sm">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#009EE3] text-[10px] font-black text-white">
        MP
      </span>
      <span className="text-xs font-extrabold tracking-tight">Mercado Pago</span>
    </div>
  );
}

function CardBrands() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="rounded bg-[#1434CB] px-2 py-1 text-[10px] font-black italic text-white">
        VISA
      </span>
      <span className="relative inline-flex h-6 w-10 items-center justify-center rounded bg-slate-900">
        <span className="absolute left-2 h-4 w-4 rounded-full bg-[#EB001B]" />
        <span className="absolute right-2 h-4 w-4 rounded-full bg-[#F79E1B] mix-blend-screen" />
      </span>
      <span className="rounded bg-white px-2 py-1 text-[10px] font-black text-[#111827] ring-1 ring-slate-200">
        <span className="text-[#00A4E0]">E</span>
        <span className="text-[#EF4123]">l</span>
        <span className="text-[#FFD200]">o</span>
      </span>
    </div>
  );
}

function PaymentStep({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: (orderId: string) => void;
}) {
  const cart = useCart();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const createOrderFn = useServerFn(createCheckoutOrder);
  const [method, setMethod] = useState<"pix" | "card" | "boleto" | "paypal" | "bank_bic">("pix");
  const [loading, setLoading] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | undefined>();
  const [pendingName, setPendingName] = useState<string | undefined>();
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pixOpen, setPixOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const [boletoOpen, setBoletoOpen] = useState(false);
  const [paypalOpen, setPaypalOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);

  const submit = async () => {
    if (cart.items.length === 0) {
      toast.error("Carrinho vazio.");
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
      const items = cart.items.map((it) => {
        const p = findProduct(it.productId);
        const fallbackName = it.domain ?? it.name ?? it.productId.replace(/^domain:/, "");
        const name = String(p?.name ?? fallbackName).trim();
        const type = p?.type ?? it.type;
        if (!it.productId || !name || !type) throw new Error("Item inválido no carrinho.");
        const quantity = Math.max(1, Math.trunc(Number(it.qty)) || 1);
        const snapshotPrice = Number(it.priceBRL);
        const price = Number((p ? lineUnit(it.productId, cart.cycle) : snapshotPrice).toFixed(2));
        const itemTotal = Number(lineTotal(it.productId, cart.cycle, quantity).toFixed(2));
        const safeTotal = Number((itemTotal > 0 ? itemTotal : price * quantity).toFixed(2));
        if (
          !Number.isFinite(price) ||
          price <= 0 ||
          !Number.isInteger(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(safeTotal) ||
          safeTotal <= 0
        ) {
          console.error("[checkout] invalid cart item", {
            item: it,
            product: p,
            name,
            type,
            quantity,
            price,
            itemTotal: safeTotal,
          });
          throw new Error("Item inválido no carrinho.");
        }
        return {
          id: p?.id ?? it.productId,
          name,
          type,
          price,
          quantity,
          domain: it.domain ?? null,
          total: safeTotal,
        };
      });

      const order = await createOrderFn({
        data: {
          cycle: cart.cycle,
          currency: "BRL",
          subtotal: Number(Number(cart.totals.subtotal).toFixed(2)),
          discount: Number(Number(cart.totals.discount).toFixed(2)),
          total,
          paymentMethod: method,
          paymentProvider:
            method === "paypal" ? "paypal" : method === "bank_bic" ? "manual_bic" : "mercadopago",
          customerEmail: user?.email ?? customer.email,
          customerName: customer.name,
          items,
        },
      });
      if (!order?.orderId) {
        throw new Error("Não foi possível criar o pedido. Tente novamente.");
      }

      setPendingOrderId(order.orderId);
      setPendingEmail(user?.email ?? customer.email);
      setPendingName(customer.name);
      setPendingAmount(total);
      if (method === "pix") setPixOpen(true);
      else if (method === "card") setCardOpen(true);
      else if (method === "boleto") setBoletoOpen(true);
      else if (method === "bank_bic") setBankOpen(true);
      else setPaypalOpen(true);
    } catch (e: any) {
      console.error("[checkout] submit error", e);
      const msg =
        typeof e?.message === "string" && e.message.length < 240
          ? e.message
          : "Não foi possível processar o pagamento. Tente novamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onApproved = () => {
    if (!pendingOrderId) return;
    cart.clear();
    setTimeout(() => {
      setPixOpen(false);
      setCardOpen(false);
      setBoletoOpen(false);
      setPaypalOpen(false);
      setBankOpen(false);
      onDone(pendingOrderId);
    }, 1200);
  };

  return (
    <div>
      <Header
        title="Pagamento"
        subtitle="Finalize com PIX em ambiente criptografado e confirmação automática."
      />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-[28px] border border-white/70 bg-white/72 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-2xl sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Método de pagamento
                </div>
                <div className="mt-1 text-lg font-black tracking-tight text-slate-950">
                  Gateway seguro ViralizaHost
                </div>
              </div>
              <MercadoPagoMark />
            </div>
            {[
              {
                id: "pix" as const,
                label: "PIX instantâneo",
                desc: "QR Code e copia e cola com aprovação em tempo real",
                icon: <PixBrandIcon className="h-9 w-9" />,
                meta: <span className="text-xs font-bold text-emerald-700">Disponível agora</span>,
                available: true,
              },
              {
                id: "card" as const,
                label: "Cartão de crédito",
                desc: "Checkout com Visa, Mastercard e Elo",
                icon: <CardBrands />,
                meta: <span className="text-xs font-bold text-blue-700">Disponível</span>,
                available: true,
              },
              {
                id: "boleto" as const,
                label: "Boleto bancário",
                desc: "Compensação em 1–2 dias úteis",
                icon: (
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white ring-1 ring-slate-200">
                    <FileText className="h-6 w-6 text-slate-700" />
                  </div>
                ),
                meta: <span className="text-xs font-bold text-slate-700">Disponível</span>,
                available: true,
              },
              {
                id: "paypal" as const,
                label: "PayPal",
                desc: "Pague com sua conta PayPal ou cartão internacional",
                icon: (
                  <div className="grid h-11 w-16 place-items-center rounded-xl bg-white ring-1 ring-slate-200">
                    <span className="text-[15px] font-black tracking-tight">
                      <span className="text-[#003087]">Pay</span>
                      <span className="text-[#009cde]">Pal</span>
                    </span>
                  </div>
                ),
                meta: (
                  <span className="text-xs font-bold text-amber-700">Sandbox (teste)</span>
                ),
                available: true,
              },
              {
                id: "bank_bic" as const,
                label: "Transferência Bancária BIC",
                desc: "Banco BIC Angola — envie o comprovativo após a transferência",
                icon: (
                  <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                    <img src={bicLogoImg} alt="Banco BIC" className="h-11 w-11 object-contain" />
                  </div>
                ),
                meta: <span className="text-xs font-bold text-red-700">Manual · Angola</span>,
                available: true,
              },
            ].map((m) => {
              const selected = method === m.id;
              return (
                <motion.button
                  key={m.id}
                  whileHover={{ y: m.available ? -4 : -1 }}
                  whileTap={{ scale: m.available ? 0.99 : 1 }}
                  onClick={() => setMethod(m.id)}
                  className={`group relative mb-3 w-full overflow-hidden rounded-3xl border p-5 text-left transition-all ${
                    selected
                      ? "border-blue-300 bg-gradient-to-br from-white via-blue-50/70 to-white shadow-[0_20px_60px_rgba(37,99,235,0.18)] ring-4 ring-blue-500/10"
                      : "border-slate-200/80 bg-white/86 shadow-[0_12px_38px_rgba(15,23,42,0.07)] hover:border-blue-200 hover:shadow-[0_18px_52px_rgba(37,99,235,0.11)]"
                  } ${!m.available ? "opacity-75" : ""}`}
                >
                  {selected && (
                    <motion.div
                      layoutId="payment-glow"
                      className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-500 via-cyan-400 to-emerald-400"
                    />
                  )}
                  <div className="relative flex items-center gap-4">
                    <div
                      className={`grid min-h-16 min-w-16 place-items-center rounded-2xl border shadow-inner transition ${selected ? "border-blue-200 bg-white" : "border-slate-100 bg-slate-50"}`}
                    >
                      {m.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-black tracking-tight text-slate-950">
                          {m.label}
                        </div>
                        {m.id === "pix" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 ring-1 ring-emerald-200">
                            <Zap className="h-3 w-3" /> Recomendado
                          </span>
                        )}
                        {!m.available && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                            Indisponível
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm leading-relaxed text-slate-500">{m.desc}</div>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">{m.meta}</div>
                    <div
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition ${selected ? "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-500/15" : "border-slate-300 bg-white"}`}
                    >
                      {selected && <Check className="h-4 w-4" />}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 pt-1">
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 text-xs text-emerald-800 flex items-start gap-3 shadow-sm">
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900 text-[13px]">Pagamento seguro</div>
                Ambiente criptografado e antifraude ativo
              </div>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-4 text-xs text-sky-900 flex items-start gap-3 shadow-sm">
              <BadgeCheck className="h-5 w-5 shrink-0 mt-0.5 text-sky-600" />
              <div>
                <div className="font-bold text-[13px]">SSL 256-bit</div>
                Conexão protegida durante toda a compra
              </div>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 text-xs text-blue-900 flex items-start gap-3 shadow-sm">
              <Lock className="h-5 w-5 shrink-0 mt-0.5 text-blue-600" />
              <div>
                <div className="font-bold text-[13px]">Anti-fraude</div>
                Validação automática Mercado Pago
              </div>
            </div>
          </div>
        </div>
        <Summary>
          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            onClick={submit}
            disabled={loading}
            className="relative mt-5 inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 py-4 text-[15px] font-black tracking-tight text-white shadow-[0_18px_45px_rgba(37,99,235,0.38)] transition hover:shadow-[0_22px_60px_rgba(37,99,235,0.48)] disabled:opacity-50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/18 to-white/0 translate-x-[-120%] transition-transform duration-700 hover:translate-x-[120%]" />
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : method === "pix" ? (
              <PixBrandIcon className="h-5 w-5" />
            ) : method === "card" ? (
              <CreditCard className="h-5 w-5" />
            ) : method === "boleto" ? (
              <FileText className="h-5 w-5" />
            ) : method === "bank_bic" ? (
              <img src={bicLogoImg} alt="" className="h-5 w-5 object-contain" />
            ) : (
              <span className="text-[13px] font-black tracking-tight">
                <span>Pay</span>
                <span className="opacity-80">Pal</span>
              </span>
            )}
            {loading
              ? "Processando…"
              : method === "pix"
                ? "Gerar PIX"
                : method === "card"
                  ? "Pagar com Cartão"
                  : method === "boleto"
                    ? "Gerar Boleto"
                    : method === "bank_bic"
                      ? "Pagar via Banco BIC"
                      : "Pagar com PayPal"}
            {!loading && <ArrowRight className="h-4 w-4" />}
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
        orderId={pendingOrderId}
        customerEmail={pendingEmail}
        onApproved={onApproved}
      />
      <CardPaymentDialog
        open={cardOpen}
        onOpenChange={setCardOpen}
        orderId={pendingOrderId}
        amount={pendingAmount}
        customerEmail={pendingEmail}
        customerName={pendingName}
        onApproved={onApproved}
      />
      <BoletoPaymentDialog
        open={boletoOpen}
        onOpenChange={setBoletoOpen}
        orderId={pendingOrderId}
        customerEmail={pendingEmail}
        customerName={pendingName}
        onApproved={onApproved}
      />
      <PayPalPaymentDialog
        open={paypalOpen}
        onOpenChange={setPaypalOpen}
        orderId={pendingOrderId}
        onApproved={onApproved}
      />
      <BankTransferDialog
        open={bankOpen}
        onOpenChange={setBankOpen}
        orderId={pendingOrderId}
        customerEmail={pendingEmail}
        amount={pendingAmount}
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
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto text-center py-12"
    >
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
        <p className="text-emerald-600 font-semibold mb-2">✓ Hospedagem activa e pronta a usar</p>
      )}
      {status === "error" && (
        <div className="text-left bg-amber-50 border border-amber-200 rounded-xl p-4 my-4 text-sm text-amber-800">
          <div className="font-semibold mb-1">Provisionamento incompleto</div>
          <ul className="list-disc pl-4 space-y-0.5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <p className="mt-2">A nossa equipa foi notificada e activará a sua conta manualmente.</p>
        </div>
      )}
      {status === "idle" && (
        <p className="text-slate-600 mb-2">
          Recebemos seu pedido e a equipa irá ativar os serviços.
        </p>
      )}
      {orderId && (
        <p className="text-xs text-slate-400 mb-8">
          Nº do pedido: <span className="font-mono">{orderId.slice(0, 8)}</span>
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-primary text-primary-foreground font-semibold shadow-glow"
        >
          Ir para o painel <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50"
        >
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

function Footer({
  onBack,
  onNext,
  nextLabel = "Continuar",
  nextDisabled = false,
  nextHint,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextHint?: string;
}) {
  return (
    <div className="mt-10 flex items-center justify-between gap-3">
      {onBack ? (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm text-slate-600 hover:text-slate-900 hover:bg-white transition"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <div className="flex flex-col items-end gap-1.5">
          <motion.button
            whileHover={{ scale: nextDisabled ? 1 : 1.03 }}
            whileTap={{ scale: nextDisabled ? 1 : 0.97 }}
            onClick={onNext}
            disabled={nextDisabled}
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold text-sm shadow-glow transition disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "radial-gradient(120px circle at 50% 0%, rgba(255,255,255,.35), transparent 60%)" }} />
            <span className="absolute -inset-1 rounded-full opacity-60 blur-xl -z-10"
                  style={{ background: "linear-gradient(135deg, oklch(0.62 0.22 255 / .7), oklch(0.5 0.24 265 / .7))" }} />
            <span className="relative">{nextLabel}</span>
            <ArrowRight className="relative h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
          {nextDisabled && nextHint && (
            <span className="text-xs text-amber-600 font-medium">{nextHint}</span>
          )}
        </div>
      )}
    </div>
  );
}

function Summary({ children }: { children?: React.ReactNode }) {
  const cart = useCart();
  const { currency } = useCurrency();
  const c = findCycle(cart.cycle);
  return (
    <aside
      className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-glow-soft p-6 h-fit sticky top-24"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.85) 100%)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
          Resumo do pedido
        </div>
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {c.label}
        </span>
      </div>
      <div className="space-y-2 text-sm mb-4 max-h-48 overflow-y-auto pr-1">
        {cart.items.map((it) => {
          const p = findProduct(it.productId);
          if (!p) return null;
          const total = lineTotal(it.productId, cart.cycle, it.qty);
          const annual = isAnnualProduct(p);
          return (
            <div key={it.productId} className="flex justify-between gap-2">
              <span className="text-slate-700 truncate">
                {p.name} ×{it.qty}
                {annual && (
                  <span className="ml-1 text-[10px] font-semibold text-emerald-700">/ano</span>
                )}
                {it.domain && !annual && (
                  <span className="block text-[11px] text-slate-400 truncate">{it.domain}</span>
                )}
              </span>
              <span className="font-semibold text-slate-900 shrink-0">{brl(total, currency)}</span>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-200 pt-3 space-y-1.5 text-sm">
        <Row label="Subtotal" value={brl(cart.totals.subtotal, currency)} />
        {cart.totals.discount > 0 && (
          <Row label="Desconto" value={`- ${brl(cart.totals.discount, currency)}`} highlight />
        )}
        <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-slate-200">
          <span className="text-sm font-semibold text-slate-700">Total</span>
          <span className="text-2xl font-extrabold text-gradient-primary tracking-tight">
            {brl(cart.totals.total, currency)}
          </span>
        </div>
      </div>
      {children}
      <div className="mt-5 pt-4 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-emerald-600" /> Pagamento seguro · SSL 256-bit
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3 w-3 text-emerald-600" /> Processado pelo Mercado Pago
        </div>
        <div className="flex items-center gap-1.5">
          <BadgeCheck className="h-3 w-3 text-sky-600" /> Cancele quando quiser
        </div>
      </div>
    </aside>
  );
}

function Row({
  label,
  value,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "text-base font-bold text-slate-900" : ""} ${highlight ? "text-emerald-600" : ""}`}
    >
      <span className={bold ? "" : "text-slate-500"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
