import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  TrendingUp,
  Target,
  Lightbulb,
  Clock,
  Thermometer,
  Loader2,
  MessageSquare,
  ExternalLink,
  Flame,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AppTopbar } from "@/components/app-topbar";
import { dashboardApi, type ApiLead, type ApiMessage } from "@/lib/api";
import { etapaToStatus, statusBadgeColor, scoreColor, formatDateTime } from "@/lib/lead-utils";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function ConversationMessages({
  leadId,
  leadName,
}: {
  leadId: string;
  leadName: string;
}) {
  const { data: messages = [], isLoading } = useQuery<ApiMessage[]>({
    queryKey: ["lead-messages", leadId],
    queryFn: () => dashboardApi.getMessages(leadId, { limit: 100 }).then((r) => r.data.data),
    refetchInterval: 10000, // poll a cada 10s para mensagens novas
  });

  const sorted = [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Nenhuma mensagem ainda.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
      {sorted.map((m) => (
        <div
          key={m._id}
          className={`flex ${m.direction === "inbound" ? "justify-start" : "justify-end"}`}
        >
          <div
            className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              m.direction === "inbound"
                ? "rounded-tl-sm bg-surface-container text-foreground"
                : "rounded-tr-sm bg-primary/20 text-foreground"
            }`}
          >
            <p>{m.content}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {m.direction === "outbound"
                ? `Sofia (IA)${m.processedByAgent ? ` · ${m.processedByAgent}` : ""}`
                : leadName}{" "}
              · {formatDateTime(m.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatPage() {
  const [activeId, setActiveId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [intelOpen, setIntelOpen] = useState(true);

  const { data: allLeads = [], isLoading: leadsLoading } = useQuery<ApiLead[]>({
    queryKey: ["leads", { limit: 100 }],
    queryFn: () => dashboardApi.getLeads({ limit: 100 }).then((r) => r.data.data),
  });

  // Only show leads that have at least 1 message, sorted by lastInteractionAt desc
  const chatLeads = allLeads
    .filter((l) => l.totalMessages > 0)
    .sort((a, b) => b.lastInteractionAt.localeCompare(a.lastInteractionAt));

  const filtered = chatLeads.filter((l) =>
    (l.name ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  // Auto-select first lead
  const effectiveActiveId = activeId || filtered[0]?._id || "";
  const active = chatLeads.find((l) => l._id === effectiveActiveId);

  return (
    <AppShell>
      <>
        <AppTopbar title="Chat" />
        <main className="flex flex-1 overflow-hidden">
          {/* Conversations list */}
          <aside className="flex w-80 flex-col border-r border-border bg-surface-container">
            <div className="border-b border-border p-4">
              <p className="text-eyebrow text-primary">Conversas</p>
              <h2 className="text-display mt-1 text-xl">Caixa de entrada</h2>
              <div className="relative mt-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar lead..."
                  className="w-full rounded-md border border-border bg-background py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {leadsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  Nenhum lead com mensagens.
                </p>
              ) : (
                filtered.map((lead) => {
                  const isActive = lead._id === effectiveActiveId;
                  return (
                    <button
                      key={lead._id}
                      onClick={() => setActiveId(lead._id)}
                      className={`flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors ${
                        isActive
                          ? "bg-accent border-l-2 border-l-primary"
                          : "hover:bg-surface-container-high"
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {initials(lead.name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {lead.name ?? `Lead #${lead._id.slice(-6)}`}
                          </p>
                          {lead.state?.prontoParaCorretor && (
                            <Flame className="h-3.5 w-3.5 shrink-0 text-orange-400" />
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {lead.totalMessages} mensagens · {formatDateTime(lead.lastInteractionAt)}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span
                            className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${statusBadgeColor(lead.state?.etapa)}`}
                          >
                            {etapaToStatus(lead.state?.etapa)}
                          </span>
                          <span className={`text-[11px] font-semibold ${scoreColor(lead.score)}`}>
                            {lead.score}pts
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Active conversation */}
          <section className="flex flex-1 flex-col bg-background">
            {active ? (
              <>
                <header className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {initials(active.name)}
                    </div>
                    <div>
                      <p className="text-display text-base text-foreground">
                        {active.name ?? `Lead #${active._id.slice(-6)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Telegram: {active.telegramChatId}
                        {active.phone && ` · ${active.phone}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      to="/leads/$leadId"
                      params={{ leadId: active._id }}
                      className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver dossiê
                    </Link>
                    <button
                      onClick={() => setIntelOpen((v) => !v)}
                      className={`ml-2 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        intelOpen
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
                      }`}
                    >
                      {intelOpen ? (
                        <PanelRightClose className="h-3.5 w-3.5" />
                      ) : (
                        <PanelRightOpen className="h-3.5 w-3.5" />
                      )}
                      Live Intelligence
                    </button>
                  </div>
                </header>

                <ConversationMessages leadId={active._id} leadName={active.name ?? "Lead"} />

                <footer className="border-t border-border bg-surface-container px-4 py-3">
                  <p className="text-center text-xs text-muted-foreground">
                    <MessageSquare className="mr-1 inline h-3 w-3" />
                    Conversa via Telegram gerenciada pela Sofia (IA). Visualização apenas.
                  </p>
                </footer>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                {leadsLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Selecione uma conversa"
                )}
              </div>
            )}
          </section>

          {/* Live Intelligence panel */}
          {intelOpen && active && (
            <aside className="flex w-80 flex-col border-l border-border bg-surface-container">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-eyebrow text-primary">Live</p>
                    <p className="text-display text-sm leading-none">Intelligence</p>
                  </div>
                </div>
                <button
                  onClick={() => setIntelOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-container-high hover:text-foreground"
                >
                  <PanelRightClose className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                {/* Lead snapshot */}
                <div>
                  <p className="text-eyebrow text-muted-foreground">Lead</p>
                  <p className="mt-1 text-display text-lg">
                    {active.name ?? `Lead #${active._id.slice(-6)}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeColor(active.state?.etapa)}`}
                    >
                      {etapaToStatus(active.state?.etapa)}
                      {active.state?.prontoParaCorretor && " 🔥"}
                    </span>
                    {active.state?.perfilEstimado && active.state.perfilEstimado !== "Indefinido" && (
                      <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                        {active.state.perfilEstimado}
                      </span>
                    )}
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Thermometer className="h-3 w-3" />
                      <span className="text-eyebrow">Score IA</span>
                    </div>
                    <p className={`mt-1 text-display text-2xl ${scoreColor(active.score)}`}>
                      {active.score}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span className="text-eyebrow">Msgs</span>
                    </div>
                    <p className="mt-1 text-display text-2xl text-foreground">
                      {active.totalMessages}
                    </p>
                  </div>
                </div>

                {/* Dossiê */}
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-eyebrow text-muted-foreground">Dossiê extraído</p>
                  <dl className="mt-2 space-y-1.5 text-xs">
                    {[
                      ["Região", active.state?.regiaoInteresse],
                      ["Tipo", active.state?.tipoImovel],
                      ["Orçamento", active.state?.orcamentoEstimado],
                      ["Dor", active.state?.dorPrincipal],
                      ["Urgência", active.state?.urgencia],
                      ["Agente", active.state?.agenteAtual],
                    ]
                      .filter(([, v]) => v)
                      .map(([k, v]) => (
                        <div key={k as string} className="flex justify-between gap-2">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="font-medium text-foreground text-right">{v as string}</dd>
                        </div>
                      ))}
                  </dl>
                  {active.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {active.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* IA insights gerados a partir do estado real */}
                <div>
                  <p className="text-eyebrow text-muted-foreground">Insights de IA</p>
                  <div className="mt-2 space-y-2">
                    {active.score >= 70 && (
                      <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-success">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <p className="text-xs font-semibold">Lead quente — score {active.score}</p>
                        </div>
                        <p className="mt-1 text-xs text-foreground/80">
                          Alta probabilidade de conversão. Priorize contato nas próximas 24h.
                        </p>
                      </div>
                    )}
                    {active.state?.prontoParaCorretor && (
                      <div className="rounded-lg border border-orange-400/30 bg-orange-400/10 p-3 text-orange-400">
                        <div className="flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5" />
                          <p className="text-xs font-semibold">Pronto para abordagem</p>
                        </div>
                        <p className="mt-1 text-xs text-foreground/80">
                          Sofia qualificou este lead. Assuma a conversa agora.
                        </p>
                      </div>
                    )}
                    {active.state?.urgencia === "alta" && (
                      <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-primary">
                        <div className="flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5" />
                          <p className="text-xs font-semibold">Alta urgência declarada</p>
                        </div>
                        <p className="mt-1 text-xs text-foreground/80">
                          Lead expressou necessidade imediata. Agilize a proposta.
                        </p>
                      </div>
                    )}
                    {active.state?.dorPrincipal && (
                      <div className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Lightbulb className="h-3.5 w-3.5" />
                          <p className="text-xs font-semibold">Dor identificada</p>
                        </div>
                        <p className="mt-1 text-xs text-foreground/80">
                          "{active.state.dorPrincipal}" — use isso como gancho na negociação.
                        </p>
                      </div>
                    )}
                    {active.totalMessages < 3 && (
                      <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-warning">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <p className="text-xs font-semibold">Conversa iniciando</p>
                        </div>
                        <p className="mt-1 text-xs text-foreground/80">
                          Poucas mensagens. A Sofia está qualificando — acompanhe o progresso.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  to="/leads/$leadId"
                  params={{ leadId: active._id }}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver dossiê completo
                </Link>
              </div>
            </aside>
          )}
        </main>
      </>
    </AppShell>
  );
}
