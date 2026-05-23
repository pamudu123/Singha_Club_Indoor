import type { AdminUser } from "@/types/database";
import { createContext, useContext, useMemo, useState, useEffect, type PropsWithChildren } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabase";

type AuthContextValue = {
  admin: AdminUser | null;
  setAdmin: (admin: AdminUser | null) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    async function recoverSession() {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
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

    const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (event, session) => {
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
  }, []);

  const value = useMemo(() => ({ admin, setAdmin, loading }), [admin, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
