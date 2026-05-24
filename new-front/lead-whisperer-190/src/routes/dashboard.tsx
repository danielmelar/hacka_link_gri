import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import {
  TrendingUp,
  TrendingDown,
  Users2,
  Building2,
  Target,
  Banknote,
  ArrowUpRight,
  CalendarClock,
} from "lucide-react";
import { AppTopbar } from "@/components/app-topbar";
import { ChannelBadge } from "@/components/channel-badge";
import { useAuth } from "@/lib/auth";
import {
  leads,
  interactions,
  empreendimentos,
  formatBRL,
  formatDateTime,
  statusColor,
} from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

const kpis = [
  {
    label: "VGV potencial (30d)",
    value: "R$ 145M",
    delta: "+12%",
    up: true,
    icon: Banknote,
  },
  { label: "Leads qualificados", value: "842", delta: "+8%", up: true, icon: Users2 },
  { label: "Taxa de conversão", value: "18,4%", delta: "-2%", up: false, icon: Target },
  { label: "Empreendimentos ativos", value: "12", delta: "+1", up: true, icon: Building2 },
];

const funnel: { stage: string; count: number }[] = [
  { stage: "Novos", count: 340 },
  { stage: "Em contato", count: 215 },
  { stage: "Qualificados", count: 142 },
  { stage: "Visitas", count: 88 },
  { stage: "Propostas", count: 41 },
  { stage: "Fechados", count: 18 },
];

function DashboardPage() {
  const { user } = useAuth();
  const max = Math.max(...funnel.map((f) => f.count));

  const myLeads = leads.filter((l) => l.ownerId === user?.id);
  const upcoming = [...interactions]
    .filter((i) => i.nextFollowUpAt)
    .sort((a, b) => a.nextFollowUpAt!.localeCompare(b.nextFollowUpAt!))
    .slice(0, 5);

  return (
    <AppShell><>
      <AppTopbar title="Dashboard" />
      <main className="flex-1 space-y-10 px-6 py-8 md:px-10">
        {/* Greeting */}
        <section className="animate-fade-in">
          <h2 className="text-display max-w-3xl text-4xl leading-tight text-foreground md:text-5xl">
            Olá, {user?.firstName}. A chave para{" "}
            <span className="italic text-primary">decisões melhores</span>.
          </h2>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Visão geral da sua operação. Tecnologia que trabalha em silêncio enquanto você fecha
            negócios.
          </p>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 gap-4 animate-fade-in stagger-1 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <div
                key={k.label}
                className="group rounded-xl border border-border bg-surface-container p-5 transition hover:border-primary/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-high text-muted-foreground group-hover:text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${
                      k.up
                        ? "border-success/30 text-success"
                        : "border-destructive/30 text-destructive"
                    }`}
                  >
                    {k.up ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {k.delta}
                  </span>
                </div>
                <p className="mt-5 text-eyebrow text-muted-foreground">{k.label}</p>
                <p className="text-display mt-1 text-3xl font-light text-foreground">{k.value}</p>
              </div>
            );
          })}
        </section>

        {/* Funnel + follow-ups */}
        <section className="grid grid-cols-1 gap-6 animate-fade-in stagger-2 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-container p-6 lg:col-span-2">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-eyebrow text-primary">Funil comercial</p>
                <h3 className="text-display mt-1 text-2xl">Últimos 30 dias</h3>
              </div>
              <Link
                to="/leads"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Ver leads <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-6 space-y-3">
              {funnel.map((f) => (
                <li key={f.stage} className="flex items-center gap-4">
                  <span className="w-32 text-xs text-muted-foreground">{f.stage}</span>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-surface-container-high">
                    <div
                      className="h-full rounded-md bg-gradient-to-r from-primary/70 to-primary"
                      style={{ width: `${(f.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-display w-14 text-right text-lg text-foreground">
                    {f.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-surface-container p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-eyebrow text-primary">Próximos follow-ups</p>
                <h3 className="text-display mt-1 text-2xl">Sua agenda</h3>
              </div>
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            </div>
            <ul className="mt-5 space-y-3">
              {upcoming.map((i) => {
                const lead = leads.find((l) => l.id === i.leadId);
                return (
                  <li
                    key={i.id}
                    className="rounded-md border border-border bg-surface-container-low p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to="/leads/$leadId"
                        params={{ leadId: i.leadId }}
                        className="font-semibold hover:text-primary"
                      >
                        {lead?.name}
                      </Link>
                      <ChannelBadge channel={i.channel} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{i.nextStep}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-wider text-primary">
                      {formatDateTime(i.nextFollowUpAt!)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* My leads + portfolio */}
        <section className="grid grid-cols-1 gap-6 animate-fade-in stagger-3 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-container p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-eyebrow text-primary">Meus leads</p>
                <h3 className="text-display mt-1 text-2xl">Em acompanhamento</h3>
              </div>
              <Link
                to="/leads"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Ver todos
              </Link>
            </div>
            <table className="mt-5 w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Lead</th>
                  <th className="pb-2 font-medium">Empreendimento</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Último canal</th>
                  <th className="pb-2 text-right font-medium">Ticket</th>
                </tr>
              </thead>
              <tbody>
                {myLeads.slice(0, 5).map((l) => {
                  const e = empreendimentos.find((x) => x.id === l.empreendimentoId);
                  return (
                    <tr
                      key={l.id}
                      className="border-t border-border/60 hover:bg-surface-container-high"
                    >
                      <td className="py-3">
                        <Link
                          to="/leads/$leadId"
                          params={{ leadId: l.id }}
                          className="font-semibold hover:text-primary"
                        >
                          {l.name}
                        </Link>
                      </td>
                      <td className="py-3 text-muted-foreground">{e?.name}</td>
                      <td className="py-3">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusColor[l.status]}`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <ChannelBadge channel={l.lastChannel} />
                      </td>
                      <td className="py-3 text-right font-medium">{formatBRL(l.budget)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-border bg-surface-container p-6">
            <p className="text-eyebrow text-primary">Portfólio</p>
            <h3 className="text-display mt-1 text-2xl">Top empreendimentos</h3>
            <ul className="mt-5 space-y-3">
              {empreendimentos.slice(0, 3).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-2"
                >
                  <img
                    src={e.cover}
                    alt={e.name}
                    className="h-14 w-14 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{e.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.neighborhood}, {e.city}
                    </p>
                    <p className="text-[11px] text-primary">VGV {formatBRL(e.vgv)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </></AppShell>
  );
}
