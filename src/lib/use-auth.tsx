import { createContext, useContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { clearCheckoutState } from "@/lib/cart";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authLoading: boolean;
  roleLoading: boolean;
  roles: string[];
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  authLoading: true,
  roleLoading: true,
  roles: [],
  isAdmin: false,
  hasRole: () => false,
  refreshRoles: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  const loadRoles = useCallback(async (uid?: string | null) => {
    if (!uid) {
      console.info("[auth] role load skipped", { reason: "no_user" });
      setRoles([]);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    console.info("[auth] loading roles", { userId: uid });

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);

    if (error) {
      console.error("[auth] failed to load roles", { userId: uid, error });
      setRoles([]);
    } else {
      const detectedRoles = (data ?? []).map((row) => row.role);
      console.info("[auth] detected role", {
        userId: uid,
        roles: detectedRoles,
        isAdmin: detectedRoles.includes("admin"),
      });
      setRoles(detectedRoles);
    }

    setRoleLoading(false);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      console.info("[auth] auth state", {
        event,
        userId: s?.user?.id ?? null,
        hasSession: !!s,
      });
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") clearCheckoutState();
      setSession(s);
      setAuthLoading(false);
      void loadRoles(s?.user?.id ?? null);
    });

    supabase.auth.getSession().then(({ data, error }) => {
      console.info("[auth] initial session", {
        userId: data.session?.user?.id ?? null,
        hasSession: !!data.session,
        error: error?.message ?? null,
      });
      setSession(data.session);
      setAuthLoading(false);
      void loadRoles(data.session?.user?.id ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadRoles]);

  const hasRole = useCallback((role: string) => roles.includes(role), [roles]);
  const isAdmin = hasRole("admin");
  const loading = authLoading || (!!session?.user && roleLoading);
  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      authLoading,
      roleLoading,
      roles,
      isAdmin,
      hasRole,
      refreshRoles: async () => loadRoles(session?.user?.id ?? null),
      signOut: async () => {
        console.info("[auth] sign out", { userId: session?.user?.id ?? null });
        clearCheckoutState();
        await supabase.auth.signOut();
        setRoles([]);
      },
    }),
    [authLoading, hasRole, isAdmin, loadRoles, loading, roleLoading, roles, session],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
