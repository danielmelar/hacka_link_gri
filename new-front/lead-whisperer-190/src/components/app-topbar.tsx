import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, ChevronDown, User, LogOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";

export function AppTopbar({ title }: { title: string }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/60 bg-background/80 px-6 backdrop-blur-md md:px-10">
      <div>
        <p className="text-eyebrow text-muted-foreground">CLAVIS</p>
        <h1 className="text-display text-2xl text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar leads, empreendimentos..."
            className="w-72 rounded-md border border-border bg-surface-container px-9 py-2 text-sm placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <button className="relative text-muted-foreground hover:text-primary">
          <Bell className="h-5 w-5" />
          <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 rounded-md border border-border bg-surface-container px-2.5 py-1.5 text-left hover:border-primary/40"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-primary-foreground"
              style={{ background: user?.avatarColor }}
            >
              {user?.firstName[0]}
            </span>
            <span className="hidden text-sm leading-tight md:block">
              <span className="block font-semibold text-foreground">
                Olá, {user?.firstName}
              </span>
              <span className="text-xs text-muted-foreground">{user?.role}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-md border border-border bg-popover shadow-elegant">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-accent"
              >
                <User className="h-4 w-4" /> Meu perfil
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
