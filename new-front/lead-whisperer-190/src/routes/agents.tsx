import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bot,
  Search,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users2,
  Handshake,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AppTopbar } from "@/components/app-topbar";
import { leads, statusColor } from "@/lib/mock-data";
import type { Lead } from "@/lib/mock-data";

export const Route = createFileRoute("/agents")({
  component: AgentsPage,
});

type AgentId =
  | "qualifier"
  | "closer"
  | "nurturer"
  | "objection"
  | "investor"
  | "concierge";

type Agent = {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  bestFor: string[];
  icon: typeof Bot;
  tone: "primary" | "success" | "warning" | "destructive";
};

const agents: Agent[] = [
  {
    id: "qualifier",
    name: "Atena — Qualificadora",
    role: "SDR Inteligente",
    description:
      "Conduz triagem inicial, valida perfil financeiro, urgência e intenção de compra antes do corretor entrar.",
    bestFor: ["Novo", "Em contato"],
    icon: Target,
    tone: "primary",
  },
  {
    id: "nurturer",
    name: "Íris — Nutridora",
    role: "Follow-up Contínuo",
    description:
      "Mantém o lead aquecido com conteúdos do empreendimento, lembretes e cadência inteligente de mensagens.",
    bestFor: ["Em contato", "Qualificado"],
    icon: Flame,
    tone: "warning",
  },
  {
    id: "closer",
    name: "Hermes — Fechador",
    role: "Sales Closer",
    description:
      "Atua na reta final: monta simulações, conduz urgência, sugere condições e prepara a proposta.",
    bestFor: ["Proposta", "Visita agendada"],
    icon: Handshake,
    tone: "success",
  },
  {
    id: "objection",
    name: "Argos — Objeções",
    role: "Especialista em Objeções",
    description:
      "Mapeia bloqueios (preço, financiamento, localização) e devolve respostas contextuais ao corretor.",
    bestFor: ["Qualificado", "Proposta"],
    icon: ShieldCheck,
    tone: "destructive",
  },
  {
    id: "investor",
    name: "Midas — Investidor",
    role: "Perfil Investidor",
    description:
      "Foca em ROI, valorização, rentabilidade locatícia e cenários de saída para leads investidores.",
    bestFor: ["Qualificado", "Proposta", "Fechado"],
    icon: TrendingUp,
    tone: "primary",
  },
  {
    id: "concierge",
    name: "Vesta — Pós-venda",
    role: "Concierge do Cliente",
    description:
      "Acompanha cliente após o fechado: vistoria, entrega de chaves, indicações e relacionamento.",
    bestFor: ["Fechado"],
    icon: CheckCircle2,
    tone: "success",
  },
];

const toneClass: Record<Agent["tone"], string> = {
  primary: "bg-primary/15 text-primary border-primary/30",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  destructive: "bg-destructive/15 text-destructive border-destructive/30",
};

type AgentMessage = {
  id: string;
  from: "agent" | "broker";
  text: string;
  time: string;
};

const seedConversations: Record<string, AgentMessage[]> = {
  "qualifier:l-1": [
    {
      id: "1",
      from: "agent",
      text: "Olá Alexandre! Triagem inicial concluída para Mariana Castro. Renda compatível, urgência alta (90 dias), busca 2 dorms no Aurora Jardins.",
      time: "08:42",
    },
    {
      id: "2",
      from: "broker",
      text: "Ela tem aprovação de crédito?",
      time: "08:44",
    },
    {
      id: "3",
      from: "agent",
      text: "Pré-aprovação na Itaú em R$ 1,1M. Falta comprovação de entrada (20%). Posso pedir os documentos?",
      time: "08:44",
    },
  ],
  "closer:l-2": [
    {
      id: "1",
      from: "agent",
      text: "Rodrigo está em estágio de Proposta. Sugiro travar bônus de campanha (-2%) válido até sexta para criar urgência.",
      time: "10:02",
    },
    {
      id: "2",
      from: "broker",
      text: "Boa. Monta a simulação para 240 meses.",
      time: "10:05",
    },
    {
      id: "3",
      from: "agent",
      text: "Simulação pronta: entrada R$ 460k, parcela R$ 14.820. Quer que eu envie em PDF para o Rodrigo?",
      time: "10:06",
    },
  ],
};

function recommendedAgents(lead: Lead): AgentId[] {
  return agents
    .filter((a) => a.bestFor.includes(lead.status))
    .map((a) => a.id);
}

function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("qualifier");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("l-1");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState<Record<string, AgentMessage[]>>(seedConversations);

  const agent = agents.find((a) => a.id === selectedAgent)!;
  const lead = leads.find((l) => l.id === selectedLeadId)!;
  const threadKey = `${selectedAgent}:${selectedLeadId}`;
  const messages = threads[threadKey] ?? [];

  const filteredLeads = useMemo(
    () =>
      leads.filter((l) =>
        l.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const recIds = recommendedAgents(lead);

  function send() {
    if (!draft.trim()) return;
    const now = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const broker: AgentMessage = {
      id: `b-${Date.now()}`,
      from: "broker",
      text: draft.trim(),
      time: now,
    };
    const reply: AgentMessage = {
      id: `a-${Date.now() + 1}`,
      from: "agent",
      text: `Anotado. Vou processar isso para ${lead.name} e te retorno em instantes.`,
      time: now,
    };
    setThreads((t) => ({
      ...t,
      [threadKey]: [...(t[threadKey] ?? []), broker, reply],
    }));
    setDraft("");
  }

  return (
    <AppShell>
      <AppTopbar title="Agentes IA" />

      <div className="grid flex-1 grid-cols-12 gap-0 overflow-hidden border-t border-border">
        {/* Left: Agent catalog */}
        <aside className="col-span-3 flex flex-col border-r border-border bg-surface-container">
          <div className="border-b border-border px-5 py-4">
            <p className="text-eyebrow text-muted-foreground">Catálogo</p>
            <h2 className="text-display text-lg">Agentes disponíveis</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <ul className="flex flex-col gap-2">
              {agents.map((a) => {
                const Icon = a.icon;
                const active = a.id === selectedAgent;
                const recommended = recIds.includes(a.id);
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => setSelectedAgent(a.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        active
                          ? "border-primary/40 bg-accent"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${toneClass[a.tone]}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {a.name}
                            </p>
                            {recommended && (
                              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-primary">
                                ideal
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {a.role}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Center: Conversation */}
        <section className="col-span-6 flex flex-col bg-background">
          <header className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-md border ${toneClass[agent.tone]}`}
              >
                <agent.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                <p className="text-xs text-muted-foreground">
                  Conversando sobre{" "}
                  <span className="text-foreground">{lead.name}</span> ·{" "}
                  <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] ${statusColor[lead.status]}`}>
                    {lead.status}
                  </span>
                </p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:border-primary/30">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Briefing do agente
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {messages.length === 0 ? (
              <div className="mx-auto mt-12 max-w-md rounded-lg border border-dashed border-border bg-card p-6 text-center">
                <Bot className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  Inicie a colaboração com {agent.name.split(" — ")[0]}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {agent.description}
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={`flex ${m.from === "broker" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg border px-3.5 py-2.5 ${
                        m.from === "broker"
                          ? "border-primary/30 bg-primary/10 text-foreground"
                          : "border-border bg-card text-foreground"
                      }`}
                    >
                      {m.from === "agent" && (
                        <p className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-primary">
                          <Bot className="h-3 w-3" />
                          {agent.name.split(" — ")[0]}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed">{m.text}</p>
                      <p className="mt-1 text-right text-[10px] text-muted-foreground">
                        {m.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-border bg-surface-container px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Pergunte ao ${agent.name.split(" — ")[0]} sobre ${lead.name}...`}
                rows={1}
                className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={send}
                className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4" /> Enviar
              </button>
            </div>
          </div>
        </section>

        {/* Right: Lead selector */}
        <aside className="col-span-3 flex flex-col border-l border-border bg-surface-container">
          <div className="border-b border-border px-5 py-4">
            <p className="text-eyebrow text-muted-foreground">Aplicar agente em</p>
            <h2 className="text-display text-lg">Leads</h2>
            <div className="relative mt-3">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar lead..."
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <ul className="flex flex-col gap-1.5">
              {filteredLeads.map((l) => {
                const active = l.id === selectedLeadId;
                const isRecommended = recommendedAgents(l).includes(selectedAgent);
                return (
                  <li key={l.id}>
                    <button
                      onClick={() => setSelectedLeadId(l.id)}
                      className={`w-full rounded-md border p-2.5 text-left transition-colors ${
                        active
                          ? "border-primary/40 bg-accent"
                          : "border-border bg-card hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {l.name}
                        </p>
                        {isRecommended && (
                          <Sparkles className="h-3 w-3 shrink-0 text-primary" />
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`rounded-sm border px-1.5 py-0.5 text-[9px] ${statusColor[l.status]}`}
                        >
                          {l.status}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Score {l.score}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="border-t border-border p-3">
            <button className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground">
              <Plus className="h-3.5 w-3.5" /> Atribuir agente em lote
            </button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
