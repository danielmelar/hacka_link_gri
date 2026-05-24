import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  Target,
  User as UserIcon,
} from "lucide-react";
import { AppTopbar } from "@/components/app-topbar";
import { dashboardApi } from "@/lib/api";
import type { ApiLead, ApiMessage } from "@/lib/api";
import {
  etapaToStatus,
  statusBadgeColor,
  scoreColor,
  formatDateTime,
} from "@/lib/lead-utils";

export const Route = createFileRoute("/leads/$leadId")({
  component: LeadDetailPage,
});

function LeadDetailPage() {
  const { leadId } = Route.useParams();

  const {
    data: lead,
    isLoading: leadLoading,
    error: leadError,
  } = useQuery<ApiLead>({
    queryKey: ["lead", leadId],
    queryFn: () => dashboardApi.getLead(leadId).then((r) => r.data.data),
    retry: 1,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ApiMessage[]>({
    queryKey: ["lead-messages", leadId],
    queryFn: () => dashboardApi.getMessages(leadId, { limit: 100 }).then((r) => r.data.data),
    enabled: !!lead,
  });

  if (leadLoading) {
    return (
      <AppShell>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (leadError || !lead) {
    return (
      <AppShell>
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 text-muted-foreground">
          <p>Lead não encontrado ou erro ao carregar.</p>
          <Link to="/leads" className="text-xs font-semibold text-primary hover:underline">
            Voltar para leads
          </Link>
        </main>
      </AppShell>
    );
  }

  const s = lead.state;

  return (
    <AppShell>
      <>
        <AppTopbar title="Detalhe do lead" />
        <main className="flex-1 space-y-6 px-6 py-8 md:px-10">
          <Link
            to="/leads"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar para leads
          </Link>

          {/* Header */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface-container p-6 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-eyebrow text-primary">Lead</p>
                  <h2 className="text-display mt-1 text-3xl">
                    {lead.name ?? `Lead #${lead._id.slice(-6)}`}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Criado em {formatDateTime(lead.createdAt)} · {lead.totalMessages} mensagens
                  </p>
                </div>
                <span
                  className={`rounded-md border px-3 py-1 text-xs font-semibold ${statusBadgeColor(s?.etapa)}`}
                >
                  {etapaToStatus(s?.etapa)}
                  {s?.prontoParaCorretor && " 🔥"}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                {lead.phone && (
                  <div className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-3">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-3">
                    <Mail className="h-4 w-4 text-primary" />
                    <span>{lead.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-3">
                  <UserIcon className="h-4 w-4 text-primary" />
                  <span>Telegram: {lead.telegramChatId}</span>
                </div>
                {s?.orcamentoEstimado && (
                  <div className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-3">
                    <Target className="h-4 w-4 text-primary" />
                    <span>Orçamento: {s.orcamentoEstimado}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 rounded-md border border-border bg-surface-container-low p-3">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>Agente: {s?.agenteAtual ?? "—"}</span>
                </div>
              </div>
            </div>

            {/* Score + dossiê */}
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface-container p-6">
                <div className="flex items-center justify-between">
                  <p className="text-eyebrow text-primary">Score IA</p>
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <p className={`text-display mt-2 text-4xl ${scoreColor(lead.score)}`}>
                  {lead.score}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all"
                    style={{ width: `${lead.score}%` }}
                  />
                </div>
              </div>

              {/* Dossiê */}
              <div className="rounded-xl border border-border bg-surface-container p-6">
                <p className="text-eyebrow text-primary">Dossiê do lead</p>
                <h3 className="text-display mt-1 text-xl">Perfil extraído</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  {[
                    ["Perfil estimado", s?.perfilEstimado],
                    ["Região de interesse", s?.regiaoInteresse],
                    ["Tipo de imóvel", s?.tipoImovel],
                    ["Tem filhos", s?.temFilhos != null ? (s.temFilhos ? `Sim (${s.quantosFilhos ?? "?"})` : "Não") : null],
                    ["Dor principal", s?.dorPrincipal],
                    ["Urgência", s?.urgencia],
                  ]
                    .filter(([, v]) => v != null && v !== "Indefinido")
                    .map(([label, value]) => (
                      <div key={label as string} className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="text-right font-medium text-foreground">{value as string}</dd>
                      </div>
                    ))}
                  {lead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {lead.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </section>

          {/* Conversation from Telegram */}
          <section className="rounded-xl border border-border bg-surface-container p-6">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <p className="text-eyebrow text-primary">Conversa com a Sofia</p>
            </div>
            <h3 className="text-display mt-1 text-2xl">Histórico Telegram</h3>

            {messagesLoading ? (
              <div className="mt-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Nenhuma mensagem registrada ainda.
              </p>
            ) : (
              <ol className="mt-6 space-y-3">
                {[...messages]
                  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                  .map((msg) => (
                    <li
                      key={msg._id}
                      className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm ${
                          msg.direction === "outbound"
                            ? "rounded-br-none bg-primary/20 text-foreground"
                            : "rounded-bl-none border border-border bg-surface-container-low text-foreground"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <span className="text-[10px] text-muted-foreground">
                            {msg.direction === "outbound" ? "Sofia (IA)" : lead.name ?? "Lead"}
                            {msg.processedByAgent && ` · ${msg.processedByAgent}`}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
              </ol>
            )}
          </section>

          {/* Notes */}
          {lead.notes && (
            <section className="rounded-xl border border-border bg-surface-container p-6">
              <p className="text-eyebrow text-primary">Notas do corretor</p>
              <p className="mt-2 text-sm text-foreground">{lead.notes}</p>
            </section>
          )}
        </main>
      </>
    </AppShell>
  );
}
