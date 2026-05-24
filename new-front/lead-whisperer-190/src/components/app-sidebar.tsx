import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users2,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  MessagesSquare,
  Bot,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import clavisHorizontal from "@/assets/clavis-horizontal.png";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users2 },
  { to: "/chat", label: "Chat", icon: MessagesSquare },
  { to: "/agents", label: "Agentes", icon: Bot },
  { to: "/portfolio", label: "Portfólio", icon: Building2 },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-sidebar md:flex">
      <div className="flex items-center justify-center px-6 py-7">
        <img
          src={clavisHorizontal}
          alt="CLAVIS — Inteligência Comercial Imobiliária"
          className="h-12 w-auto object-contain"
        />
      </div>

      <nav className="flex-1 px-3">
        <p className="px-3 pb-2 text-eyebrow text-muted-foreground">Operação</p>
        <ul className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = path === item.to || path.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-accent text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 transition-colors ${
                      active ? "text-primary" : "group-hover:text-primary"
                    }`}
                  />
                  <span className="font-medium tracking-tight">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-2 px-4 pb-6">
        <button
          onClick={logout}
          className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </aside>
  );
}
