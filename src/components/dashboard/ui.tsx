import { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-card ${className}`}>{children}</div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="text-center py-14 animate-card-rise">
      <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 ring-1 ring-blue-500/20 flex items-center justify-center">
        <Icon className="h-7 w-7 text-blue-600" />
      </div>
      <h3 className="mt-4 font-semibold text-lg">{title}</h3>
      <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    activo: "bg-emerald-50 text-emerald-700 border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    pendente: "bg-amber-50 text-amber-700 border-amber-200",
    expired: "bg-slate-100 text-slate-600 border-slate-200",
    paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    overdue: "bg-red-50 text-red-700 border-red-200",
    open: "bg-blue-50 text-blue-700 border-blue-200",
    closed: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const cls = map[status.toLowerCase()] || "bg-slate-100 text-slate-700 border-slate-200";
  const isLive = ["active", "activo", "paid"].includes(status.toLowerCase());
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {isLive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {status}
    </span>
  );
}
