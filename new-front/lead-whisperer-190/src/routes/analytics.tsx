import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AppTopbar } from "@/components/app-topbar";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

const channels = [
  { name: "WhatsApp", value: 412, color: "var(--success)" },
  { name: "Ligação", value: 187, color: "var(--primary)" },
  { name: "Presencial", value: 102, color: "var(--warning)" },
  { name: "Telegram", value: 78, color: "oklch(0.78 0.09 230)" },
  { name: "E-mail", value: 63, color: "var(--muted-foreground)" },
];

function AnalyticsPage() {
  const total = channels.reduce((s, c) => s + c.value, 0);
  return (
    <AppShell><>
      <AppTopbar title="Analytics" />
      <main className="flex-1 space-y-6 px-6 py-8 md:px-10">
        <div>
          <p className="text-eyebrow text-primary">Analytics</p>
          <h2 className="text-display mt-1 text-3xl">Performance comercial</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão consolidada para coordenação. Mais métricas em breve.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-container p-6 lg:col-span-2">
            <p className="text-eyebrow text-primary">Interações por canal</p>
            <h3 className="text-display mt-1 text-2xl">Últimos 30 dias</h3>
            <ul className="mt-5 space-y-3">
              {channels.map((c) => (
                <li key={c.name} className="flex items-center gap-4">
                  <span className="w-24 text-xs text-muted-foreground">{c.name}</span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-surface-container-high">
                    <div
                      className="h-full rounded-md"
                      style={{
                        width: `${(c.value / total) * 100}%`,
                        background: c.color,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span className="text-display w-16 text-right text-lg">{c.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface-container p-6">
            <p className="text-eyebrow text-primary">Próximos módulos</p>
            <h3 className="text-display mt-1 text-2xl">Em evolução</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>· Scoring de lead com IA</li>
              <li>· Automação de follow-up</li>
              <li>· Integrações WhatsApp e Telegram</li>
              <li>· Integração de telefonia/voz</li>
              <li>· Dashboard gerencial avançado</li>
              <li>· 2FA + Auth0 com Google</li>
            </ul>
          </div>
        </div>
      </main>
    </></AppShell>
  );
}
