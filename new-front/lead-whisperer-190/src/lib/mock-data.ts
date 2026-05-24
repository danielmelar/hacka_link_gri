export type LeadStatus =
  | "Novo"
  | "Em contato"
  | "Qualificado"
  | "Visita agendada"
  | "Proposta"
  | "Fechado"
  | "Perdido";

export type Channel = "WhatsApp" | "Telegram" | "Ligação" | "Presencial" | "E-mail";

export type InteractionResult =
  | "Interessado"
  | "Sem resposta"
  | "Reagendado"
  | "Visita marcada"
  | "Proposta enviada"
  | "Não qualificado";

export interface Interaction {
  id: string;
  leadId: string;
  channel: Channel;
  datetime: string; // ISO
  responsibleId: string;
  responsibleName: string;
  summary: string;
  result: InteractionResult;
  nextStep?: string;
  nextFollowUpAt?: string; // ISO
}

export interface Empreendimento {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  units: number;
  priceFrom: number;
  status: "Lançamento" | "Em obras" | "Pronto";
  vgv: number; // R$
  cover: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: LeadStatus;
  budget: number;
  empreendimentoId: string;
  ownerId: string;
  ownerName: string;
  source: "Site" | "Indicação" | "Stand" | "Meta Ads" | "Google Ads";
  createdAt: string;
  lastChannel: Channel;
  score: number; // 0-100
}

export const empreendimentos: Empreendimento[] = [
  {
    id: "e-1",
    name: "Edifício Aurora Jardins",
    city: "São Paulo",
    neighborhood: "Pinheiros",
    units: 84,
    priceFrom: 1_280_000,
    status: "Em obras",
    vgv: 215_000_000,
    cover:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "e-2",
    name: "Reserva Mata Atlântica",
    city: "Rio de Janeiro",
    neighborhood: "Barra da Tijuca",
    units: 132,
    priceFrom: 2_150_000,
    status: "Lançamento",
    vgv: 412_000_000,
    cover:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "e-3",
    name: "Praça Vila Madá",
    city: "São Paulo",
    neighborhood: "Vila Madalena",
    units: 56,
    priceFrom: 890_000,
    status: "Pronto",
    vgv: 98_000_000,
    cover:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=70",
  },
  {
    id: "e-4",
    name: "Marina Ponta Verde",
    city: "Maceió",
    neighborhood: "Ponta Verde",
    units: 96,
    priceFrom: 1_490_000,
    status: "Em obras",
    vgv: 178_000_000,
    cover:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=70",
  },
];

export const leads: Lead[] = [
  {
    id: "l-1",
    name: "Mariana Castro",
    phone: "+55 11 98765-4321",
    email: "mariana.castro@email.com",
    status: "Visita agendada",
    budget: 1_500_000,
    empreendimentoId: "e-1",
    ownerId: "u-1",
    ownerName: "Alexandre Moraes",
    source: "Site",
    createdAt: "2026-05-12T13:24:00Z",
    lastChannel: "WhatsApp",
    score: 86,
  },
  {
    id: "l-2",
    name: "Rodrigo Almeida",
    phone: "+55 21 99812-3344",
    email: "rodrigo.a@email.com",
    status: "Proposta",
    budget: 2_300_000,
    empreendimentoId: "e-2",
    ownerId: "u-1",
    ownerName: "Alexandre Moraes",
    source: "Meta Ads",
    createdAt: "2026-05-10T09:00:00Z",
    lastChannel: "Ligação",
    score: 92,
  },
  {
    id: "l-3",
    name: "Beatriz Nogueira",
    phone: "+55 11 99771-2210",
    email: "bia.nog@email.com",
    status: "Qualificado",
    budget: 950_000,
    empreendimentoId: "e-3",
    ownerId: "u-2",
    ownerName: "Rafaela Lima",
    source: "Indicação",
    createdAt: "2026-05-18T15:40:00Z",
    lastChannel: "Telegram",
    score: 74,
  },
  {
    id: "l-4",
    name: "Henrique Souto",
    phone: "+55 82 98123-7711",
    email: "h.souto@email.com",
    status: "Em contato",
    budget: 1_800_000,
    empreendimentoId: "e-4",
    ownerId: "u-1",
    ownerName: "Alexandre Moraes",
    source: "Stand",
    createdAt: "2026-05-19T11:10:00Z",
    lastChannel: "Presencial",
    score: 61,
  },
  {
    id: "l-5",
    name: "Carla Bianchi",
    phone: "+55 11 97712-0091",
    email: "carla.b@email.com",
    status: "Novo",
    budget: 1_200_000,
    empreendimentoId: "e-1",
    ownerId: "u-1",
    ownerName: "Alexandre Moraes",
    source: "Google Ads",
    createdAt: "2026-05-22T08:45:00Z",
    lastChannel: "WhatsApp",
    score: 48,
  },
  {
    id: "l-6",
    name: "Fernando Tavares",
    phone: "+55 21 98800-1010",
    email: "fer.t@email.com",
    status: "Fechado",
    budget: 2_700_000,
    empreendimentoId: "e-2",
    ownerId: "u-2",
    ownerName: "Rafaela Lima",
    source: "Indicação",
    createdAt: "2026-04-30T17:20:00Z",
    lastChannel: "Presencial",
    score: 98,
  },
  {
    id: "l-7",
    name: "Letícia Aragão",
    phone: "+55 11 98123-4455",
    email: "leticia.a@email.com",
    status: "Perdido",
    budget: 700_000,
    empreendimentoId: "e-3",
    ownerId: "u-1",
    ownerName: "Alexandre Moraes",
    source: "Site",
    createdAt: "2026-05-02T10:00:00Z",
    lastChannel: "WhatsApp",
    score: 22,
  },
];

export const interactions: Interaction[] = [
  {
    id: "i-1",
    leadId: "l-1",
    channel: "WhatsApp",
    datetime: "2026-05-22T14:10:00Z",
    responsibleId: "u-1",
    responsibleName: "Alexandre Moraes",
    summary: "Cliente confirmou visita ao decorado no sábado às 10h.",
    result: "Visita marcada",
    nextStep: "Receber no stand do Aurora Jardins.",
    nextFollowUpAt: "2026-05-25T10:00:00Z",
  },
  {
    id: "i-2",
    leadId: "l-1",
    channel: "Ligação",
    datetime: "2026-05-20T16:30:00Z",
    responsibleId: "u-1",
    responsibleName: "Alexandre Moraes",
    summary: "Apresentação rápida do empreendimento e tipologias de 2 e 3 dorms.",
    result: "Interessado",
    nextStep: "Enviar tabela de preços por WhatsApp.",
    nextFollowUpAt: "2026-05-22T14:00:00Z",
  },
  {
    id: "i-3",
    leadId: "l-2",
    channel: "Presencial",
    datetime: "2026-05-19T11:00:00Z",
    responsibleId: "u-1",
    responsibleName: "Alexandre Moraes",
    summary: "Visita ao stand. Cliente trouxe esposa, ambos gostaram da cobertura.",
    result: "Proposta enviada",
    nextStep: "Aguardar análise de crédito.",
    nextFollowUpAt: "2026-05-26T10:00:00Z",
  },
  {
    id: "i-4",
    leadId: "l-3",
    channel: "Telegram",
    datetime: "2026-05-21T19:00:00Z",
    responsibleId: "u-2",
    responsibleName: "Rafaela Lima",
    summary: "Esclarecimento sobre financiamento e ITBI.",
    result: "Interessado",
    nextStep: "Agendar visita ao Vila Madá.",
    nextFollowUpAt: "2026-05-24T15:00:00Z",
  },
  {
    id: "i-5",
    leadId: "l-4",
    channel: "Presencial",
    datetime: "2026-05-19T11:10:00Z",
    responsibleId: "u-1",
    responsibleName: "Alexandre Moraes",
    summary: "Atendimento no plantão de Maceió. Pediu material por e-mail.",
    result: "Interessado",
    nextStep: "Enviar book digital do Marina Ponta Verde.",
    nextFollowUpAt: "2026-05-23T10:00:00Z",
  },
  {
    id: "i-6",
    leadId: "l-5",
    channel: "WhatsApp",
    datetime: "2026-05-22T08:50:00Z",
    responsibleId: "u-1",
    responsibleName: "Alexandre Moraes",
    summary: "Primeiro contato. Pediu vídeo do decorado.",
    result: "Sem resposta",
    nextStep: "Tentar novo contato em 2 dias.",
    nextFollowUpAt: "2026-05-24T09:00:00Z",
  },
];

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const statusColor: Record<LeadStatus, string> = {
  Novo: "bg-secondary/40 text-secondary-foreground border-secondary/40",
  "Em contato": "bg-warning/15 text-warning border-warning/30",
  Qualificado: "bg-primary/15 text-primary border-primary/30",
  "Visita agendada": "bg-accent text-accent-foreground border-primary/30",
  Proposta: "bg-primary/25 text-primary border-primary/40",
  Fechado: "bg-success/20 text-success border-success/30",
  Perdido: "bg-destructive/15 text-destructive border-destructive/30",
};
