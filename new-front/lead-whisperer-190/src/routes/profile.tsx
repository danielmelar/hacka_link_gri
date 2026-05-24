import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AppTopbar } from "@/components/app-topbar";
import { useAuth } from "@/lib/auth";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  return (
    <AppShell><>
      <AppTopbar title="Meu perfil" />
      <main className="flex-1 space-y-6 px-6 py-8 md:px-10">
        <div className="flex items-center gap-5 rounded-xl border border-border bg-surface-container p-6">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-primary-foreground"
            style={{ background: user.avatarColor }}
          >
            {user.firstName[0]}
          </span>
          <div className="flex-1">
            <p className="text-eyebrow text-primary">{user.role}</p>
            <h2 className="text-display mt-1 text-3xl">{user.name}</h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface-container p-6">
            <p className="text-eyebrow text-primary">Dados pessoais</p>
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Nome" value={user.name} />
              <Row label="E-mail" value={user.email} />
              <Row label="Papel" value={user.role} />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface-container p-6">
            <p className="text-eyebrow text-primary">Segurança</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Em breve: ativação de 2FA, login com Google via Auth0 e logs de acesso.
            </p>
          </div>
        </div>
      </main>
    </></AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
