import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreHorizontal,
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  TrendingUp,
  Target,
  AlertTriangle,
  Lightbulb,
  Clock,
  Thermometer,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AppTopbar } from "@/components/app-topbar";
import { ChannelBadge } from "@/components/channel-badge";
import { leads, empreendimentos, formatBRL, statusColor } from "@/lib/mock-data";
import type { Channel } from "@/lib/mock-data";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

type ChatMessage = {
  id: string;
  fromLead: boolean;
  text: string;
  time: string;
};

const conversations: Record<string, ChatMessage[]> = {
  "l-1": [
    { id: "m1", fromLead: true, text: "Oi Alexandre, tudo bem? Recebi o material do Aurora Jardins.", time: "09:12" },
    { id: "m2", fromLead: false, text: "Mariana, ótimo! O que achou da tipologia de 3 dormitórios?", time: "09:14" },
    { id: "m3", fromLead: true, text: "Adorei a planta. Queria entender a localização da vaga de garagem.", time: "09:18" },
    { id: "m4", fromLead: false, text: "Posso te mostrar pessoalmente sábado às 10h, te envio o pin do decorado?", time: "09:20" },
    { id: "m5", fromLead: true, text: "Perfeito, confirmado!", time: "09:21" },
  ],
  "l-2": [
    { id: "m1", fromLead: false, text: "Rodrigo, segue a proposta atualizada da cobertura.", time: "Ontem" },
    { id: "m2", fromLead: true, text: "Vou conversar com minha esposa hoje à noite e te retorno amanhã.", time: "Ontem" },
    { id: "m3", fromLead: false, text: "Combinado. Qualquer dúvida sobre o financiamento estou aqui.", time: "Ontem" },
  ],
  "l-3": [
    { id: "m1", fromLead: true, text: "Bom dia! Vocês trabalham com financiamento direto?", time: "08:45" },
    { id: "m2", fromLead: false, text: "Bom dia Beatriz, sim — trabalhamos com Caixa, Itaú e financiamento próprio.", time: "08:50" },
  ],
  "l-4": [
    { id: "m1", fromLead: false, text: "Henrique, segue o book digital do Marina Ponta Verde.", time: "10:02" },
    { id: "m2", fromLead: true, text: "Recebido, vou analisar.", time: "10:30" },
  ],
  "l-5": [
    { id: "m1", fromLead: false, text: "Carla, bom dia! Conforme conversamos, segue o vídeo do decorado.", time: "08:55" },
  ],
};

type Insight = {
  icon: typeof TrendingUp;
  title: string;
  desc: string;
  tone: "primary" | "warning" | "success" | "destructive";
};

const liveInsights: Record<string, Insight[]> = {
  "l-1": [
    {
      icon: TrendingUp,
      title: "Score subindo +12 pts",
      desc: "Engajamento alto nas últimas 48h. Visita confirmada eleva probabilidade de conversão para 78%.",
      tone: "success",
    },
    {
      icon: Lightbulb,
      title: "Sinal de compra",
      desc: "Mencionou 'vaga de garagem' — interesse em detalhes operacionais é forte sinal de intenção.",
      tone: "primary",
    },
    {
      icon: Clock,
      title: "Janela ideal de follow-up",
      desc: "Lead responde entre 09h–10h. Próximo contato sugerido após a visita de sábado.",
      tone: "warning",
    },
  ],
  "l-2": [
    {
      icon: AlertTriangle,
      title: "Decisão compartilhada",
      desc: "Cliente envolveu o cônjuge na decisão. Prepare material para o casal e considere uma reunião conjunta.",
      tone: "warning",
    },
    {
      icon: Target,
      title: "Proposta em análise",
      desc: "Janela típica de fechamento: 5–7 dias após proposta. Follow-up programado para 26/05.",
      tone: "primary",
    },
  ],
  "l-3": [
    {
      icon: Lightbulb,
      title: "Foco em financiamento",
      desc: "Pergunta sobre crédito indica que budget pode ser ajustado. Apresente simulações.",
      tone: "primary",
    },
  ],
  "l-4": [
    {
      icon: Clock,
      title: "Resposta lenta",
      desc: "Tempo médio de resposta aumentou 3x. Reaqueça com conteúdo de valor (tour virtual).",
      tone: "warning",
    },
  ],
  "l-5": [
    {
      icon: AlertTriangle,
      title: "Lead frio — primeiro contato",
      desc: "Score 48. Priorize qualificação por canal preferido (WhatsApp) nas próximas 24h.",
      tone: "destructive",
    },
  ],
};

const toneClass: Record<Insight["tone"], string> = {
  primary: "border-primary/30 bg-primary/10 text-primary",
  warning: "border-warning/30 bg-warning/10 text-warning",
  success: "border-success/30 bg-success/10 text-success",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
};

function ChatPage() {
  const chatLeads = useMemo(() => leads.filter((l) => conversations[l.id]), []);
  const [activeId, setActiveId] = useState<string>(chatLeads[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [intelOpen, setIntelOpen] = useState(true);

  const active = chatLeads.find((l) => l.id === activeId);
  const empreendimento = active
    ? empreendimentos.find((e) => e.id === active.empreendimentoId)
    : undefined;
  const messages = active ? conversations[active.id] ?? [] : [];
  const insights = active ? liveInsights[active.id] ?? [] : [];

  const filtered = chatLeads.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase()),
  );

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
              {filtered.map((lead) => {
                const last = conversations[lead.id]?.at(-1);
                const isActive = lead.id === activeId;
                return (
                  <button
                    key={lead.id}
                    onClick={() => setActiveId(lead.id)}
                    className={`flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors ${
                      isActive
                        ? "bg-accent border-l-2 border-l-primary"
                        : "hover:bg-surface-container-high"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {lead.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {lead.name}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {last?.time}
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {last?.text ?? "—"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <ChannelBadge channel={lead.lastChannel as Channel} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Active conversation */}
          <section className="flex flex-1 flex-col bg-background">
            {active ? (
              <>
                <header className="flex items-center justify-between border-b border-border px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                      {active.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-display text-base text-foreground">{active.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {empreendimento?.name} · {active.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="rounded-md p-2 text-muted-foreground hover:bg-surface-container-high hover:text-foreground">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="rounded-md p-2 text-muted-foreground hover:bg-surface-container-high hover:text-foreground">
                      <Video className="h-4 w-4" />
                    </button>
                    <button className="rounded-md p-2 text-muted-foreground hover:bg-surface-container-high hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
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

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.fromLead ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.fromLead
                            ? "rounded-tl-sm bg-surface-container text-foreground"
                            : "rounded-tr-sm bg-primary/20 text-foreground"
                        }`}
                      >
                        <p>{m.text}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{m.time}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <footer className="border-t border-border bg-surface-container px-4 py-3">
                  <div className="flex items-end gap-2">
                    <button className="rounded-md p-2 text-muted-foreground hover:bg-surface-container-high hover:text-foreground">
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={1}
                      placeholder={`Mensagem para ${active.name}...`}
                      className="flex-1 resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    />
                    <button
                      onClick={() => setDraft("")}
                      className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Send className="h-4 w-4" />
                      Enviar
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Selecione uma conversa
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

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                {/* Lead snapshot */}
                <div>
                  <p className="text-eyebrow text-muted-foreground">Lead</p>
                  <p className="mt-1 text-display text-lg">{active.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${statusColor[active.status]}`}
                    >
                      {active.status}
                    </span>
                    <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                      {active.source}
                    </span>
                  </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Thermometer className="h-3 w-3" />
                      <span className="text-eyebrow">Score</span>
                    </div>
                    <p className="mt-1 text-display text-2xl text-primary">{active.score}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Target className="h-3 w-3" />
                      <span className="text-eyebrow">Budget</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatBRL(active.budget)}
                    </p>
                  </div>
                </div>

                {empreendimento && (
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-eyebrow text-muted-foreground">Empreendimento</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {empreendimento.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {empreendimento.neighborhood} · {empreendimento.city}
                    </p>
                    <p className="mt-1.5 text-xs text-primary">
                      a partir de {formatBRL(empreendimento.priceFrom)}
                    </p>
                  </div>
                )}

                {/* Insights */}
                <div>
                  <p className="text-eyebrow text-muted-foreground">Insights de IA</p>
                  <div className="mt-2 space-y-2">
                    {insights.map((ins, i) => {
                      const Icon = ins.icon;
                      return (
                        <div
                          key={i}
                          className={`rounded-lg border p-3 ${toneClass[ins.tone]}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5" />
                            <p className="text-xs font-semibold">{ins.title}</p>
                          </div>
                          <p className="mt-1 text-xs text-foreground/80">{ins.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recommended action */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-1.5 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <p className="text-eyebrow">Próxima ação</p>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground">
                    Confirmar presença 24h antes da visita e enviar pin de localização do
                    decorado.
                  </p>
                  <button className="mt-3 w-full rounded-md bg-primary py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90">
                    Agendar lembrete
                  </button>
                </div>
              </div>
            </aside>
          )}
        </main>
      </>
    </AppShell>
  );
}
