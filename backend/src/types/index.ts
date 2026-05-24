// ============================================
// LinkGRI - Core Type Definitions
// ============================================

export type PerfilEstimado = 'MCMV' | 'MedioPadrao' | 'AltoPadrao' | 'Indefinido';
export type AgenteAtual = 'SDR_Geral' | 'Especialista_Familia' | 'Especialista_Alto_Padrao';
export type EtapaLead = 'inicio' | 'qualificacao' | 'apresentacao' | 'agendamento' | 'fechamento';
export type TipoImovel = 'apartamento' | 'casa' | 'terreno' | 'comercial' | 'cobertura' | 'flat';
export type PlanoBroker = 'free' | 'pro' | 'enterprise';

// ============================================
// Lead State
// ============================================

export interface LeadState {
  perfilEstimado: PerfilEstimado;
  temFilhos: boolean | null;
  quantosFilhos: number | null;
  dorPrincipal: string | null;
  orcamentoEstimado: string | null;
  regiaoInteresse: string | null;
  tipoImovel: TipoImovel | null;
  urgencia: 'baixa' | 'media' | 'alta' | null;
  agenteAtual: AgenteAtual;
  prontoParaCorretor: boolean;
  etapa: EtapaLead;
}

// ============================================
// Extracted Entities (from AI)
// ============================================

export interface ExtractedEntities {
  nome?: string;
  telefone?: string;
  email?: string;
  temFilhos?: boolean;
  quantosFilhos?: number;
  idadeFilhos?: string;
  orcamento?: string;
  regiaoInteresse?: string;
  tipoImovel?: TipoImovel;
  urgencia?: 'baixa' | 'media' | 'alta';
  motivacaoCompra?: string;
  dataPossivelVisita?: string;
}

// ============================================
// Agent Graph State
// ============================================

export interface AgentGraphState {
  leadId: string;
  brokerId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
  }>;
  extractedEntities: ExtractedEntities;
  currentAgent: 'sofia' | 'especialista_familia' | 'especialista_alto_padrao';
  shouldEscalate: boolean;
  suggestedProperties: string[];
  response: string;
  metadata?: Record<string, any>;
}

// ============================================
// Telegram Types
// ============================================

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: TelegramChat;
  text?: string;
  entities?: Array<{
    type: string;
    offset: number;
    length: number;
  }>;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
}

// ============================================
// SSE Events
// ============================================

export type SSEEventType = 
  | 'new_lead'
  | 'lead_update' 
  | 'lead_qualified'
  | 'message_received'
  | 'lead_ready'
  | 'agent_changed';

export interface SSEEvent {
  type: SSEEventType;
  timestamp: string;
  data: any;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

// ============================================
// Dashboard Types
// ============================================

export interface LeadDashboardData {
  id: string;
  name: string | null;
  score: number;
  state: LeadState;
  lastInteractionAt: Date;
  unreadMessages: number;
  telegramChatId: string;
}

export interface BrokerStats {
  totalLeads: number;
  activeLeads: number;
  qualifiedLeads: number;
  readyForContact: number;
  conversionRate: number;
  averageResponseTime: number;
}
