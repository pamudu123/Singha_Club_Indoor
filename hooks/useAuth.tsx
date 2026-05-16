import type { AdminUser } from "@/types/database";
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from "react";

type AuthContextValue = {
  admin: AdminUser | null;
  setAdmin: (admin: AdminUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const value = useMemo(() => ({ admin, setAdmin }), [admin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
