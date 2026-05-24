import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useMemo, useState } from "react";
import { Filter, Plus, Search } from "lucide-react";
import { AppTopbar } from "@/components/app-topbar";
import { ChannelBadge, ALL_CHANNELS } from "@/components/channel-badge";
import {
  empreendimentos,
  formatBRL,
  formatDateTime,
  leads as seedLeads,
  statusColor,
  type Channel,
  type LeadStatus,
} from "@/lib/mock-data";

export const Route = createFileRoute("/leads")({
  component: LeadsPage,
});

const STATUSES: LeadStatus[] = [
  "Novo",
  "Em contato",
  "Qualificado",
  "Visita agendada",
  "Proposta",
  "Fechado",
  "Perdido",
];

function LeadsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<LeadStatus | "Todos">("Todos");
  const [channel, setChannel] = useState<Channel | "Todos">("Todos");

  const filtered = useMemo(
    () =>
      seedLeads.filter((l) => {
        if (status !== "Todos" && l.status !== status) return false;
        if (channel !== "Todos" && l.lastChannel !== channel) return false;
        if (query && !`${l.name} ${l.email}`.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      }),
    [query, status, channel],
  );

  return (
    <AppShell><>
      <AppTopbar title="Gestão de leads" />
      <main className="flex-1 space-y-6 px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-eyebrow text-primary">Funil comercial</p>
            <h2 className="text-display mt-1 text-3xl">
              {filtered.length} leads em acompanhamento
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Disciplina de follow-up e rastreabilidade total por canal de contato.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Novo lead
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-container p-4">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou e-mail"
              className="w-full rounded-md border border-border bg-surface-container-low px-9 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LeadStatus | "Todos")}
              className="rounded-md border border-border bg-surface-container-low px-3 py-2 text-sm"
            >
              <option>Todos</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as Channel | "Todos")}
              className="rounded-md border border-border bg-surface-container-low px-3 py-2 text-sm"
            >
              <option>Todos</option>
              {ALL_CHANNELS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface-container">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Lead</th>
                <th className="px-5 py-3 font-medium">Empreendimento</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Último canal</th>
                <th className="px-5 py-3 font-medium">Corretor</th>
                <th className="px-5 py-3 font-medium">Atualizado</th>
                <th className="px-5 py-3 text-right font-medium">Ticket</th>
                <th className="px-5 py-3 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const e = empreendimentos.find((x) => x.id === l.empreendimentoId);
                return (
                  <tr
                    key={l.id}
                    className="border-t border-border/60 hover:bg-surface-container-high"
                  >
                    <td className="px-5 py-3">
                      <Link
                        to="/leads/$leadId"
                        params={{ leadId: l.id }}
                        className="font-semibold hover:text-primary"
                      >
                        {l.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{l.email}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{e?.name}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusColor[l.status]}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <ChannelBadge channel={l.lastChannel} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{l.ownerName}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {formatDateTime(l.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatBRL(l.budget)}</td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`text-display text-base ${
                          l.score >= 80
                            ? "text-success"
                            : l.score >= 50
                              ? "text-primary"
                              : "text-muted-foreground"
                        }`}
                      >
                        {l.score}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                    Nenhum lead encontrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </></AppShell>
  );
}
