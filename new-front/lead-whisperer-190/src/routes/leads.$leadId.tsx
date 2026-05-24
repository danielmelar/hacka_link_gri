import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Mail,
  Phone,
  Plus,
  Sparkles,
  Target,
  User as UserIcon,
} from "lucide-react";
import { AppTopbar } from "@/components/app-topbar";
import { ChannelBadge, ALL_CHANNELS } from "@/components/channel-badge";
import { useAuth } from "@/lib/auth";
import {
  empreendimentos,
  formatBRL,
  formatDateTime,
  interactions as seedInteractions,
  leads,
  statusColor,
  type Channel,
  type Interaction,
  type InteractionResult,
} from "@/lib/mock-data";

export const Route = createFileRoute("/leads/$leadId")({
  loader: ({ params }) => {
    const lead = leads.find((l) => l.id === params.leadId);
    if (!lead) throw notFound();
    return { lead } as { lead: import("@/lib/mock-data").Lead };
  },
  component: LeadDetailPage,
  notFoundComponent: () => (
    <main className="flex min-h-screen items-center justify-center text-muted-foreground">
      Lead não encontrado.
    </main>
  ),
});

const RESULTS: InteractionResult[] = [
  "Interessado",
  "Sem resposta",
  "Reagendado",
  "Visita marcada",
  "Proposta enviada",
  "Não qualificado",
];

function LeadDetailPage() {
  const { lead } = Route.useLoaderData();
  const { user } = useAuth();
  const empreendimento = empreendimentos.find((e) => e.id === lead.empreendimentoId);

  const [items, setItems] = useState<Interaction[]>(() =>
    seedInteractions
      .filter((i) => i.leadId === lead.id)
      .sort((a, b) => b.datetime.localeCompare(a.datetime)),
  );

  const [channel, setChannel] = useState<Channel>("WhatsApp");
  const [summary, setSummary] = useState("");
  const [result, setResult] = useState<InteractionResult>("Interessado");
  const [nextStep, setNextStep] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  const filterChannels = useMemo(
    () => Array.from(new Set(items.map((i) => i.channel))) as Channel[],
    [items],
  );
  const [filter, setFilter] = useState<Channel | "Todos">("Todos");
  const visible = items.filter((i) => filter === "Todos" || i.channel === filter);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    const newItem: Interaction = {
      id: `i-${Date.now()}`,
      leadId: lead.id,
      channel,
      datetime: new Date().toISOString(),
      responsibleId: user?.id ?? "u-1",
      responsibleName: user?.name ?? "Você",
      summary: summary.trim(),
      result,
      nextStep: nextStep.trim() || undefined,
      nextFollowUpAt: nextFollowUp ? new Date(nextFollowUp).toISOString() : undefined,
    };
    setItems((prev) => [newItem, ...prev]);
    setSummary("");
    setNextStep("");
    setNextFollowUp("");
  };

  return (
    <AppShell><>
      <AppTopbar title="Detalhe do lead" />
      <main className="flex-1 space-y-6 px-6 py-8 md:px-10">
        <Link
          to="/leads"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para leads
        </Link>

        {/* Header card */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface-container p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-eyebrow text-primary">Lead</p>
                <h2 className="text-display mt-1 text-3xl">{lead.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Origem: <span className="text-foreground">{lead.source}</span> · Criado em{" "}
                  {formatDateTime(lead.createdAt)}
                </p>
              </div>
              <span
                className={`rounded-md border px-3 py-1 text-xs font-semibold ${statusColor[lead.status as keyof typeof statusColor]}`}
              >
                {lead.status}
              </span>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-3">
                <Phone className="h-4 w-4 text-primary" />
                <span>{lead.phone}</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-3">
                <Mail className="h-4 w-4 text-primary" />
                <span>{lead.email}</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-3">
                <UserIcon className="h-4 w-4 text-primary" />
                <span>Corretor: {lead.ownerName}</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-3">
                <Target className="h-4 w-4 text-primary" />
                <span>Ticket: {formatBRL(lead.budget)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-surface-container p-6">
              <p className="text-eyebrow text-primary">Empreendimento principal</p>
              {empreendimento && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={empreendimento.cover}
                    alt={empreendimento.name}
                    className="h-16 w-16 rounded-md object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold">{empreendimento.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {empreendimento.neighborhood}, {empreendimento.city}
                    </p>
                    <p className="text-xs text-primary">
                      A partir de {formatBRL(empreendimento.priceFrom)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-surface-container p-6">
              <div className="flex items-center justify-between">
                <p className="text-eyebrow text-primary">Score</p>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <p className="text-display mt-2 text-4xl text-foreground">{lead.score}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                  style={{ width: `${lead.score}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Recomendação: contato por {lead.lastChannel} nas próximas 24h.
              </p>
            </div>
          </div>
        </section>

        {/* New interaction + timeline */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form
            onSubmit={submit}
            className="space-y-4 rounded-xl border border-border bg-surface-container p-6"
          >
            <div>
              <p className="text-eyebrow text-primary">Registrar interação</p>
              <h3 className="text-display mt-1 text-2xl">Nova ação</h3>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Canal</span>
              <div className="flex flex-wrap gap-2">
                {ALL_CHANNELS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChannel(c)}
                    className={`rounded-md border px-2 py-1 text-xs ${
                      channel === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface-container-low text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Resumo da interação</span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                required
                className="w-full rounded-md border border-border bg-surface-container-low px-3 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
                placeholder="O que aconteceu nesse contato?"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Resultado</span>
              <select
                value={result}
                onChange={(e) => setResult(e.target.value as InteractionResult)}
                className="w-full rounded-md border border-border bg-surface-container-low px-3 py-2 text-sm"
              >
                {RESULTS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Próximo passo</span>
              <input
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="Ex.: enviar tabela de preços"
                className="w-full rounded-md border border-border bg-surface-container-low px-3 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs text-muted-foreground">Próximo follow-up</span>
              <input
                type="datetime-local"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
                className="w-full rounded-md border border-border bg-surface-container-low px-3 py-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Registrar ação
            </button>
          </form>

          <div className="rounded-xl border border-border bg-surface-container p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-eyebrow text-primary">Histórico</p>
                <h3 className="text-display mt-1 text-2xl">Linha do tempo</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setFilter("Todos")}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    filter === "Todos"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todos
                </button>
                {filterChannels.map((c) => (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    className={`rounded-md border px-2 py-1 text-xs ${
                      filter === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <ol className="mt-6 space-y-4">
              {visible.map((i) => (
                <li
                  key={i.id}
                  className="relative rounded-lg border border-border bg-surface-container-low p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ChannelBadge channel={i.channel} />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(i.datetime)} · {i.responsibleName}
                      </span>
                    </div>
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {i.result}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-foreground">{i.summary}</p>
                  {(i.nextStep || i.nextFollowUpAt) && (
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                      {i.nextStep && (
                        <span>
                          Próximo passo:{" "}
                          <span className="text-foreground">{i.nextStep}</span>
                        </span>
                      )}
                      {i.nextFollowUpAt && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <CalendarClock className="h-3 w-3" />
                          {formatDateTime(i.nextFollowUpAt)}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              ))}
              {visible.length === 0 && (
                <li className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma interação para esse filtro.
                </li>
              )}
            </ol>
          </div>
        </section>
      </main>
    </></AppShell>
  );
}
