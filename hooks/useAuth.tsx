import type { AdminUser } from "@/types/database";
import { createContext, useContext, useMemo, useState, useEffect, useCallback, type PropsWithChildren } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";
import { loadAdminSettings } from "@/lib/settingsService";
import { useLanguage } from "./useLanguage";

type AuthContextValue = {
  admin: AdminUser | null;
  setAdmin: (admin: AdminUser | null) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthClientWithSession = {
  getSession: () => Promise<{ data: { session: { user: { id: string } } | null } }>;
  onAuthStateChange: (
    callback: (event: string, session: { user: { id: string } } | null) => void | Promise<void>
  ) => { data: { subscription: { unsubscribe: () => void } } };
};

export function AuthProvider({ children }: PropsWithChildren) {
  const { setLang } = useLanguage();
  const [admin, setAdminState] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);

  const setAdmin = useCallback((nextAdmin: AdminUser | null) => {
    setAdminState(nextAdmin);
    if (nextAdmin) {
      loadAdminSettings(nextAdmin.id).then((result) => {
        if (result.data) setLang(result.data.language);
      });
    }
  }, [setLang]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    async function recoverSession() {
      try {
        const auth = supabase!.auth as unknown as AuthClientWithSession;
        const { data: { session } } = await auth.getSession();
        if (session?.user) {
          const { data, error } = await supabase!
            .from("admin_users")
            .select("*")
            .eq("id", session.user.id)
            .limit(1)
            .maybeSingle();

          if (data && !error) {
            setAdmin(data as AdminUser);
          }
        }
      } catch (err) {
        console.error("Auth session recovery error:", err);
      } finally {
        setLoading(false);
      }
    }

    recoverSession();

    const auth = supabase!.auth as unknown as AuthClientWithSession;
    const { data: { subscription } } = auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const { data, error } = await supabase!
            .from("admin_users")
            .select("*")
            .eq("id", session.user.id)
            .limit(1)
            .maybeSingle();

          if (data && !error) {
            setAdmin(data as AdminUser);
          }
        } catch (err) {
          console.error("Auth change synchronization error:", err);
        }
      } else {
        setAdmin(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setAdmin]);

  const value = useMemo(() => ({ admin, setAdmin, loading }), [admin, loading, setAdmin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
