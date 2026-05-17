import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  LifeBuoy,
  LogOut,
  Loader2,
  LayoutDashboard,
  Globe,
  Mail,
  Server,
  Shield,
  Megaphone,
  Palette,
  Video,
  Bot,
  Link2,
  Gift,
  GraduationCap,
  HelpCircle,
  Receipt,
  UserCircle,
  Menu,
  X,
  Search,
  ShieldCheck,
} from "lucide-react";
import logo from "@/assets/viralizahost-logo.png";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const navItems = [
  { to: "/dashboard", label: "Início", icon: LayoutDashboard, color: "text-blue-600", bg: "bg-blue-500/10" },
  { to: "/sites", label: "Sites", icon: Globe, color: "text-cyan-600", bg: "bg-cyan-500/10" },
  { to: "/emails", label: "E-mails", icon: Mail, color: "text-sky-600", bg: "bg-sky-500/10" },
  { to: "/domains", label: "Domínios", icon: Globe, color: "text-indigo-600", bg: "bg-indigo-500/10" },
  { to: "/hosting", label: "Hospedagens", icon: Server, color: "text-blue-700", bg: "bg-blue-500/10" },
  { to: "/security", label: "Segurança & Backup", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  { to: "/marketing", label: "Marketing", icon: Megaphone, color: "text-rose-600", bg: "bg-rose-500/10" },
  { to: "/meu-design", label: "Design Gráfico", icon: Palette, color: "text-fuchsia-600", bg: "bg-fuchsia-500/10" },
  { to: "/meu-audiovisual", label: "Audiovisual", icon: Video, color: "text-amber-600", bg: "bg-amber-500/10" },
  { to: "/ai", label: "IA & Automação", icon: Bot, color: "text-violet-600", bg: "bg-violet-500/10" },
  { to: "/linkbio", label: "Link na Bio", icon: Link2, color: "text-pink-600", bg: "bg-pink-500/10" },
  { to: "/referral", label: "Indique e Ganhe", icon: Gift, color: "text-lime-600", bg: "bg-lime-500/10" },
  { to: "/courses", label: "Cursos", icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-500/10" },
  { to: "/support", label: "Suporte", icon: HelpCircle, color: "text-cyan-700", bg: "bg-cyan-500/10" },
  { to: "/invoices", label: "Faturas", icon: Receipt, color: "text-emerald-700", bg: "bg-emerald-500/10" },
  { to: "/account", label: "Minha Conta", icon: UserCircle, color: "text-slate-600", bg: "bg-slate-500/10" },
] as const;

function AuthLayout() {
  const { user, loading, authLoading, roleLoading, signOut, isAdmin, roles } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    console.info("[auth] layout guard", {
      authLoading,
      roleLoading,
      userId: user?.id ?? null,
      roles,
      isAdmin,
      redirectReason: !authLoading && !user ? "no_authenticated_user" : null,
    });
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, roleLoading, user, roles, isAdmin, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: primaryAccount } = useQuery({
    queryKey: ["primary-cpanel", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("cpanel_accounts")
        .select("username,domain,status,plan_name,package")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (profile?.must_change_password && pathname !== "/change-password") {
      navigate({ to: "/change-password" });
    }
  }, [profile?.must_change_password, pathname, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  // Prefer the cPanel username (e.g. "fundacao") over legacy profile.full_name (often "root")
  const legacy = !profile?.full_name || profile.full_name === "root";
  const displayName = (legacy ? primaryAccount?.username : profile?.full_name)
    || primaryAccount?.username
    || user.email?.split("@")[0]
    || "Cliente";
  const planLabel = primaryAccount?.plan_name ?? primaryAccount?.package ?? null;
  const accountStatus = primaryAccount?.status ?? null;
  const statusTone =
    accountStatus === "active"
      ? "bg-emerald-500"
      : accountStatus === "suspended"
        ? "bg-red-500"
        : "bg-slate-400";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside
        className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 transition-transform flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="ViralizaHost" className="h-8 w-auto object-contain" />
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <SideLink key={item.to} {...item} onClick={() => setMobileOpen(false)} />
          ))}
          {isAdmin && (
            <>
              <div className="px-3 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Admin
              </div>
              <SideLink
                to="/admin/servers"
                label="Servidores WHM"
                icon={ShieldCheck}
                color="text-amber-600"
                bg="bg-amber-500/10"
                onClick={() => setMobileOpen(false)}
              />
              <SideLink
                to="/admin/provisioning"
                label="Provisionamentos"
                icon={Server}
                color="text-violet-600"
                bg="bg-violet-500/10"
                onClick={() => setMobileOpen(false)}
              />
              <SideLink
                to="/admin/provider-products"
                label="Produtos Hostinger"
                icon={Bot}
                color="text-fuchsia-600"
                bg="bg-fuchsia-500/10"
                onClick={() => setMobileOpen(false)}
              />
            </>
          )}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={() => signOut().then(() => navigate({ to: "/login" }))}
            className="w-full flex items-center gap-2 text-sm text-slate-600 hover:text-red-600 transition"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-8 gap-4">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Pesquisar serviços, domínios, faturas..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-100 border border-transparent focus:border-blue-600 focus:bg-white outline-none text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="p-2 rounded-lg hover:bg-slate-100 relative">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </button>
            <Link to="/support" className="p-2 rounded-lg hover:bg-slate-100">
              <LifeBuoy className="h-5 w-5 text-slate-600" />
            </Link>
            <Link
              to="/account"
              className="hidden sm:flex items-center gap-3 pl-3 pr-2 py-1.5 ml-1 rounded-xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 hover:border-blue-400 hover:shadow-glow-soft transition-all"
            >
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center text-sm font-semibold shadow-lg ring-2 ring-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white ${statusTone}`}
                  title={accountStatus ?? "—"}
                />
              </div>
              <div className="text-sm leading-tight pr-1">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  {displayName}
                  {planLabel && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      {planLabel}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 truncate max-w-[180px]">{user.email}</div>
              </div>
            </Link>
          </div>
        </header>
        <main key={pathname} className="flex-1 p-4 lg:p-8 animate-page-in">
          <Outlet />
        </main>
      </div>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-black/30 lg:hidden" />
      )}
    </div>
  );
}

function SideLink({
  to,
  label,
  icon: Icon,
  color,
  bg,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  onClick?: () => void;
}) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const active = path === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold shadow-sm"
          : "text-slate-700 hover:bg-slate-100 hover:translate-x-0.5"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-600" />
      )}
      <span
        className={`h-7 w-7 rounded-md flex items-center justify-center transition-all duration-200 ${bg} ${
          active ? "ring-1 ring-blue-500/20" : "group-hover:scale-110"
        }`}
      >
        <Icon className={`h-4 w-4 ${color}`} />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
