import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { useState } from "react";
import { Filter, Loader2, Search } from "lucide-react";
import { AppTopbar } from "@/components/app-topbar";
import { dashboardApi, type ApiLead } from "@/lib/api";
import { etapaToStatus, statusBadgeColor, scoreColor, formatDateTime } from "@/lib/lead-utils";

function LeadsLayout() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <LeadsPage />;
}

export const Route = createFileRoute("/leads")({
  component: LeadsLayout,
});

const ETAPAS = [
  "Todos",
  "inicio",
  "qualificacao",
  "qualificado",
  "apresentacao",
  "visita_agendada",
  "proposta",
  "fechado",
  "perdido",
];

function LeadsPage() {
  const [query, setQuery] = useState("");
  const [etapa, setEtapa] = useState<string>("Todos");
  const [prontoParaCorretor, setProntoParaCorretor] = useState<string>("Todos");

  const params: Record<string, unknown> = { limit: 100 };
  if (etapa !== "Todos") params.etapa = etapa;
  if (prontoParaCorretor !== "Todos") params.prontoParaCorretor = prontoParaCorretor === "Sim";

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads", params],
    queryFn: () => dashboardApi.getLeads(params).then((r) => r.data.data),
  });

  const filtered = leads.filter((l: ApiLead) => {
    if (!query) return true;
    const term = query.toLowerCase();
    return (
      (l.name ?? "").toLowerCase().includes(term) ||
      (l.phone ?? "").includes(term) ||
      (l.email ?? "").toLowerCase().includes(term)
    );
  });

  return (
    <AppShell>
      <>
        <AppTopbar title="Gestão de leads" />
        <main className="flex-1 space-y-6 px-6 py-8 md:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-eyebrow text-primary">Funil comercial</p>
              <h2 className="text-display mt-1 text-3xl">
                {isLoading ? "…" : `${filtered.length} leads`}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Leads qualificados pela Sofia, prontos para o corretor fechar.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-container p-4">
            <div className="relative min-w-64 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, telefone ou e-mail"
                className="w-full rounded-md border border-border bg-surface-container-low px-9 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={etapa}
                onChange={(e) => setEtapa(e.target.value)}
                className="rounded-md border border-border bg-surface-container-low px-3 py-2 text-sm"
              >
                {ETAPAS.map((s) => (
                  <option key={s} value={s}>
                    {s === "Todos" ? "Todas etapas" : etapaToStatus(s)}
                  </option>
                ))}
              </select>
              <select
                value={prontoParaCorretor}
                onChange={(e) => setProntoParaCorretor(e.target.value)}
                className="rounded-md border border-border bg-surface-container-low px-3 py-2 text-sm"
              >
                <option value="Todos">Todos</option>
                <option value="Sim">Prontos p/ corretor</option>
                <option value="Não">Não prontos</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-border bg-surface-container">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Lead</th>
                    <th className="px-5 py-3 font-medium">Etapa</th>
                    <th className="px-5 py-3 font-medium">Perfil</th>
                    <th className="px-5 py-3 font-medium">Orçamento estimado</th>
                    <th className="px-5 py-3 font-medium">Última interação</th>
                    <th className="px-5 py-3 font-medium">Msgs</th>
                    <th className="px-5 py-3 text-right font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l: ApiLead) => (
                    <tr
                      key={l._id}
                      className="border-t border-border/60 hover:bg-surface-container-high"
                    >
                      <td className="px-5 py-3">
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
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusBadgeColor(l.state?.etapa)}`}
                        >
                          {etapaToStatus(l.state?.etapa)}
                        </span>
                        {l.state?.prontoParaCorretor && (
                          <span className="ml-1.5 inline-block rounded-md border border-success/40 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                            🔥 Pronto
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {l.state?.perfilEstimado ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {l.state?.orcamentoEstimado ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {formatDateTime(l.lastInteractionAt)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{l.totalMessages}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-display text-base ${scoreColor(l.score)}`}>
                          {l.score}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                        Nenhum lead encontrado com esses filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </>
    </AppShell>
  );
}
