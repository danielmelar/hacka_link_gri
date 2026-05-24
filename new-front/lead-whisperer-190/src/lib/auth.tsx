import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, type ApiBroker } from "@/lib/api";
import { connectSSE, disconnectSSE } from "@/lib/sse";

export type Role = "Corretor" | "Coordenador" | "Admin";

export interface AuthUser {
  id: string;
  name: string;
  firstName: string;
  email: string;
  role: Role;
  plan: string;
  avatarColor: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "clavis_token";

function brokerToUser(broker: ApiBroker): AuthUser {
  const firstName = broker.name.split(" ")[0];
  // Simple deterministic color from email
  const colors = [
    "oklch(0.82 0.09 78)",
    "oklch(0.72 0.14 155)",
    "oklch(0.70 0.12 250)",
    "oklch(0.75 0.11 30)",
  ];
  const idx = broker.email.charCodeAt(0) % colors.length;
  return {
    id: broker._id,
    name: broker.name,
    firstName,
    email: broker.email,
    role: "Corretor",
    plan: broker.plan,
    avatarColor: colors[idx],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore session via /auth/me if token exists
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => {
        const u = brokerToUser(res.data.data);
        setUser(u);
        connectSSE();
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token, broker } = res.data.data;
    localStorage.setItem(TOKEN_KEY, token);
    const u = brokerToUser(broker);
    setUser(u);
    connectSSE();
    return u;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    disconnectSSE();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
