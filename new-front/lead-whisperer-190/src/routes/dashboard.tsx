import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import {
  TrendingUp,
  Users2,
  Building2,
  Target,
  MessageSquare,
  ArrowUpRight,
  Loader2,
  Flame,
} from "lucide-react";
import { AppTopbar } from "@/components/app-topbar";
import { useAuth } from "@/lib/auth";
import { dashboardApi, analyticsApi, propertiesApi, type ApiLead } from "@/lib/api";
import { etapaToStatus, scoreColor, formatDateTime } from "@/lib/lead-utils";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => dashboardApi.getStats().then((r) => r.data.data),
  });

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => analyticsApi.getOverview().then((r) => r.data.data),
  });

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ["leads", { limit: 5 }],
    queryFn: () => dashboardApi.getLeads({ limit: 5 }).then((r) => r.data.data),
  });

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ["properties", { limit: 3 }],
    queryFn: () => propertiesApi.getAll({ limit: 3, active: true }).then((r) => r.data.data),
  });

  const isLoading = statsLoading || overviewLoading;

  const kpis = [
    {
      label: "Total de leads",
      value: statsData ? String(statsData.leads.total) : "—",
      sub: `${statsData?.leads.active ?? 0} ativos (7d)`,
      up: true,
      icon: Users2,
    },
    {
      label: "Leads qualificados",
      value: statsData ? String(statsData.leads.qualified) : "—",
      sub: `Score ≥ 60`,
      up: true,
      icon: Target,
    },
    {
      label: "Prontos p/ contato",
      value: statsData ? String(statsData.leads.readyForContact) : "—",
      sub: "Aguardando corretor",
      up: true,
      icon: Flame,
    },
    {
      label: "Imóveis ativos",
      value: statsData ? String(statsData.properties) : "—",
      sub: "No portfólio",
      up: true,
      icon: Building2,
    },
    {
      label: "Mensagens (30d)",
      value: statsData ? String(statsData.messages.total) : "—",
      sub: `${statsData?.messages.inbound ?? 0} recebidas`,
      up: true,
      icon: MessageSquare,
    },
    {
      label: "Taxa de qualificação",
      value: overviewData ? `${overviewData.leads.conversionRate}%` : "—",
      sub: "Leads qualificados / total",
      up: (overviewData?.leads.conversionRate ?? 0) >= 50,
      icon: TrendingUp,
    },
  ];

  const funnel = overviewData
    ? [
        { stage: "Total", count: overviewData.leads.total },
        { stage: "Qualificados", count: overviewData.leads.qualified },
        { stage: "Prontos p/ corretor", count: overviewData.leads.readyForContact },
        { stage: "Captados", count: overviewData.leads.claimed },
      ]
    : [];

  const max = funnel.length > 0 ? Math.max(...funnel.map((f) => f.count), 1) : 1;

  return (
    <AppShell>
      <>
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
          <section className="grid grid-cols-1 gap-4 animate-fade-in stagger-1 md:grid-cols-2 xl:grid-cols-3">
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
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                  <p className="mt-5 text-eyebrow text-muted-foreground">{k.label}</p>
                  <p className="text-display mt-1 text-3xl font-light text-foreground">{k.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{k.sub}</p>
                </div>
              );
            })}
          </section>

          {/* Funnel + recent leads */}
          <section className="grid grid-cols-1 gap-6 animate-fade-in stagger-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-container p-6 lg:col-span-2">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-eyebrow text-primary">Funil comercial</p>
                  <h3 className="text-display mt-1 text-2xl">Visão geral</h3>
                </div>
                <Link
                  to="/leads"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Ver leads <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {overviewLoading ? (
                <div className="mt-8 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ul className="mt-6 space-y-3">
                  {funnel.map((f) => (
                    <li key={f.stage} className="flex items-center gap-4">
                      <span className="w-40 text-xs text-muted-foreground">{f.stage}</span>
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
              )}
            </div>

            {/* Top properties */}
            <div className="rounded-xl border border-border bg-surface-container p-6">
              <p className="text-eyebrow text-primary">Portfólio</p>
              <h3 className="text-display mt-1 text-2xl">Top imóveis</h3>
              {propertiesLoading ? (
                <div className="mt-6 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ul className="mt-5 space-y-3">
                  {(propertiesData ?? []).slice(0, 3).map((p) => (
                    <li
                      key={p._id}
                      className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-2"
                    >
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-surface-container-high text-muted-foreground">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.address.neighborhood}, {p.address.city}
                        </p>
                        <p className="text-[11px] text-primary">
                          {p.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                    </li>
                  ))}
                  {(propertiesData ?? []).length === 0 && (
                    <li className="text-sm text-muted-foreground">Nenhum imóvel cadastrado.</li>
                  )}
                </ul>
              )}
            </div>
          </section>

          {/* Recent leads */}
          <section className="animate-fade-in stagger-3">
            <div className="rounded-xl border border-border bg-surface-container p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-eyebrow text-primary">Leads recentes</p>
                  <h3 className="text-display mt-1 text-2xl">Últimas interações</h3>
                </div>
                <Link to="/leads" className="text-xs font-semibold text-primary hover:underline">
                  Ver todos
                </Link>
              </div>
              {leadsLoading ? (
                <div className="mt-6 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <table className="mt-5 w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="pb-2 font-medium">Lead</th>
                      <th className="pb-2 font-medium">Etapa</th>
                      <th className="pb-2 font-medium">Perfil</th>
                      <th className="pb-2 font-medium">Última interação</th>
                      <th className="pb-2 text-right font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leadsData ?? []).map((l: ApiLead) => (
                      <tr
                        key={l._id}
                        className="border-t border-border/60 hover:bg-surface-container-high"
                      >
                        <td className="py-3">
                          <Link
                            to="/leads/$leadId"
                            params={{ leadId: l._id }}
                            className="font-semibold hover:text-primary"
                          >
                            {l.name ?? `Lead #${l._id.slice(-6)}`}
                          </Link>
                          {l.phone && (
                            <p className="text-xs text-muted-foreground">{l.phone}</p>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="inline-block rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {etapaToStatus(l.state?.etapa)}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {l.state?.perfilEstimado ?? "—"}
                        </td>
                        <td className="py-3 text-xs text-muted-foreground">
                          {formatDateTime(l.lastInteractionAt)}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`text-display text-base ${scoreColor(l.score)}`}>
                            {l.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {(leadsData ?? []).length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-8 text-center text-sm text-muted-foreground"
                        >
                          Nenhum lead encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </>
    </AppShell>
  );
}
