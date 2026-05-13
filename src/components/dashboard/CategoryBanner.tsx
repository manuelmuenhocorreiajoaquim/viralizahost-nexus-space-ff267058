import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Variant =
  | "hosting" | "security" | "marketing" | "design" | "video" | "ai"
  | "domains" | "emails" | "sites" | "invoices" | "support" | "courses"
  | "linkbio" | "referral" | "account";

export function CategoryBanner({
  variant,
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
}: {
  variant: Variant;
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl text-white shadow-elegant cat-overlay cat-grid cat-${variant} mb-8 animate-page-in`}
    >
      <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center ring-1 ring-white/25 shadow-lg">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0">
            {eyebrow && (
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                {eyebrow}
              </div>
            )}
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">{title}</h1>
            {description && (
              <p className="text-sm md:text-[15px] text-white/85 mt-1.5 max-w-2xl">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {/* Floating decorative orbs */}
      <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/20 blur-3xl" />
    </div>
  );
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  tone = "blue",
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "blue" | "emerald" | "violet" | "amber" | "rose" | "cyan" | "indigo";
  action?: ReactNode;
}) {
  const toneMap: Record<string, string> = {
    blue: "from-blue-500/15 to-blue-500/5 text-blue-600 ring-blue-500/20",
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 ring-emerald-500/20",
    violet: "from-violet-500/15 to-violet-500/5 text-violet-600 ring-violet-500/20",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-600 ring-amber-500/20",
    rose: "from-rose-500/15 to-rose-500/5 text-rose-600 ring-rose-500/20",
    cyan: "from-cyan-500/15 to-cyan-500/5 text-cyan-600 ring-cyan-500/20",
    indigo: "from-indigo-500/15 to-indigo-500/5 text-indigo-600 ring-indigo-500/20",
  };
  return (
    <div className="group bg-white border border-slate-200 rounded-2xl p-5 card-hover animate-card-rise">
      <div
        className={`h-11 w-11 rounded-xl bg-gradient-to-br ${toneMap[tone]} ring-1 flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-semibold">{title}</div>
      <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
