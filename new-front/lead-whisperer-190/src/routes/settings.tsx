import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AppTopbar } from "@/components/app-topbar";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

const sections = [
  {
    title: "Equipe & papéis",
    desc: "Convide corretores, defina coordenadores e administradores.",
    cta: "Em breve",
  },
  {
    title: "Integrações",
    desc: "WhatsApp Business, Telegram, telefonia VoIP e portais.",
    cta: "Em breve",
  },
  {
    title: "Automação de follow-up",
    desc: "Cadências de contato com regras por canal e estágio do funil.",
    cta: "Em breve",
  },
  {
    title: "Segurança",
    desc: "Ative 2FA, SSO (Auth0 com Google) e políticas de senha.",
    cta: "Em breve",
  },
];

function SettingsPage() {
  return (
    <AppShell><>
      <AppTopbar title="Configurações" />
      <main className="flex-1 space-y-6 px-6 py-8 md:px-10">
        <div>
          <p className="text-eyebrow text-primary">Workspace</p>
          <h2 className="text-display mt-1 text-3xl">Configurações da plataforma</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-xl border border-border bg-surface-container p-6"
            >
              <h3 className="text-display text-xl">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              <button
                disabled
                className="mt-4 rounded-md border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary opacity-70"
              >
                {s.cta}
              </button>
            </div>
          ))}
        </div>
      </main>
    </></AppShell>
  );
}
