import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "Corretor" | "Coordenador" | "Admin";

export interface AuthUser {
  id: string;
  name: string;
  firstName: string;
  email: string;
  role: Role;
  avatarColor: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "clavis.auth.user";

const MOCK_USERS: Record<string, AuthUser & { password: string }> = {
  "alexandre@clavis.com": {
    id: "u-1",
    name: "Alexandre Moraes",
    firstName: "Alexandre",
    email: "alexandre@clavis.com",
    role: "Corretor",
    avatarColor: "oklch(0.82 0.09 78)",
    password: "clavis",
  },
  "rafaela@clavis.com": {
    id: "u-2",
    name: "Rafaela Lima",
    firstName: "Rafaela",
    email: "rafaela@clavis.com",
    role: "Coordenador",
    avatarColor: "oklch(0.72 0.14 155)",
    password: "clavis",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 400));
    const record = MOCK_USERS[email.trim().toLowerCase()];
    if (!record || record.password !== password) {
      throw new Error("Credenciais inválidas. Tente alexandre@clavis.com / clavis");
    }
    const { password: _p, ...safe } = record;
    setUser(safe);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return safe;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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
