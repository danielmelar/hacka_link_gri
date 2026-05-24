export interface Lead {
  _id: string;
  brokerId: string;
  telegramChatId: string;
  name?: string;
  phone?: string;
  email?: string;
  state: LeadState;
  score: number;
  scoreHistory: ScoreHistoryItem[];
  lastInteractionAt: string;
  firstInteractionAt: string;
  totalMessages: number;
  isActive: boolean;
  claimedByBroker: boolean;
  claimedAt?: string;
  tags: string[];
  notes?: string;
  scheduledAppointment?: ScheduledAppointment;
  suggestedPropertyIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadState {
  perfilEstimado: 'MCMV' | 'MedioPadrao' | 'AltoPadrao' | 'Indefinido';
  temFilhos: boolean | null;
  quantosFilhos: number | null;
  dorPrincipal: string | null;
  orcamentoEstimado: string | null;
  regiaoInteresse: string | null;
  tipoImovel: 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'cobertura' | 'flat' | null;
  urgencia: 'baixa' | 'media' | 'alta' | null;
  agenteAtual: 'SDR_Geral' | 'Especialista_Familia' | 'Especialista_Alto_Padrao';
  prontoParaCorretor: boolean;
  etapa: 'inicio' | 'qualificacao' | 'apresentacao' | 'agendamento' | 'fechamento';
}

export interface ScoreHistoryItem {
  score: number;
  reason: string;
  timestamp: string;
}

export interface ScheduledAppointment {
  date: string;
  location?: string;
  notes?: string;
}

export interface Message {
  _id: string;
  leadId: string;
  brokerId: string;
  direction: 'inbound' | 'outbound';
  content: string;
  telegramMessageId?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Property {
  _id: string;
  brokerId: string;
  title: string;
  description: string;
  price: number;
  priceType: 'venda' | 'aluguel' | 'temporada';
  type: string;
  status: 'disponivel' | 'reservado' | 'vendido' | 'indisponivel';
  bedrooms: number;
  bathrooms: number;
  suites: number;
  parkingSpots: number;
  area: number;
  areaUtil?: number;
  areaTotal?: number;
  address: {
    street: string;
    number?: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  features: string[];
  targetProfile: string[];
  images: Array<{
    url: string;
    caption?: string;
    isMain?: boolean;
  }>;
  active: boolean;
  featured: boolean;
  stats: {
    views: number;
    inquiries: number;
    shares: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  _id: string;
  leadId: string;
  brokerId: string;
  type: 'ligacao' | 'visita' | 'email' | 'whatsapp' | 'reuniao' | 'outro';
  status: 'pendente' | 'concluido' | 'cancelado';
  scheduledAt: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  leads: {
    total: number;
    active: number;
    qualified: number;
    readyForContact: number;
  };
  messages: {
    inbound: number;
    outbound: number;
    total: number;
  };
  properties: number;
}

export interface AnalyticsOverview {
  leads: {
    total: number;
    newThisMonth: number;
    newThisWeek: number;
    qualified: number;
    readyForContact: number;
    claimed: number;
    conversionRate: number;
  };
  properties: {
    total: number;
    active: number;
  };
  timeline: Array<{ date: string; count: number }>;
}

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  avgScore: number;
}

export interface AgentPerformance {
  agent: string;
  label: string;
  totalLeads: number;
  avgScore: number;
  qualifiedCount: number;
  readyCount: number;
  qualificationRate: number;
}

export interface BrokerSettings {
  profile: {
    name: string;
    email: string;
    phone?: string;
  };
  plan: string;
  settings: {
    notificationEmail: boolean;
    notificationPush: boolean;
    autoQualification: boolean;
    workingHours: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  deepLink?: string;
}
