import type { LeadState, ExtractedEntities } from '../types';

interface ScoringRule {
  field: string;
  condition: (value: any) => boolean;
  points: number;
  reason: string;
}

const scoringRules: ScoringRule[] = [
  // Basic information
  { field: 'nome', condition: (v) => !!v, points: 5, reason: 'Nome informado' },
  { field: 'telefone', condition: (v) => !!v, points: 10, reason: 'Telefone informado' },
  { field: 'email', condition: (v) => !!v, points: 5, reason: 'Email informado' },

  // Property preferences
  { field: 'tipoImovel', condition: (v) => !!v, points: 10, reason: 'Tipo de imóvel definido' },
  { field: 'regiaoInteresse', condition: (v) => !!v, points: 10, reason: 'Região de interesse definida' },
  { field: 'orcamento', condition: (v) => !!v, points: 15, reason: 'Orçamento informado' },

  // Family information
  { field: 'temFilhos', condition: (v) => v !== null && v !== undefined, points: 10, reason: 'Informação sobre filhos' },
  { field: 'quantosFilhos', condition: (v) => v !== null && v > 0, points: 5, reason: 'Número de filhos informado' },
  { field: 'idadeFilhos', condition: (v) => !!v, points: 5, reason: 'Idade dos filhos informada' },

  // Urgency and motivation
  { field: 'urgencia', condition: (v) => v === 'alta', points: 15, reason: 'Urgência alta' },
  { field: 'urgencia', condition: (v) => v === 'media', points: 10, reason: 'Urgência média' },
  { field: 'motivacaoCompra', condition: (v) => !!v, points: 10, reason: 'Motivação de compra informada' },
  { field: 'dataPossivelVisita', condition: (v) => !!v, points: 10, reason: 'Data de visita mencionada' },

  // Profile and stage
  { field: 'perfilEstimado', condition: (v) => v !== 'Indefinido', points: 15, reason: 'Perfil estimado definido' },
  { field: 'etapa', condition: (v) => v === 'apresentacao' || v === 'agendamento' || v === 'fechamento', points: 10, reason: 'Lead em estágio avançado' },
];

/**
 * Calculate score based on the COMPLETE accumulated state of the lead.
 * This function should be called AFTER merging new entities into lead.state.
 * Optional leadFields can include name, phone, email from the Lead document.
 */
export function calculateScore(
  leadState: LeadState,
  entities: ExtractedEntities,
  leadFields?: { name?: string | null; phone?: string | null; email?: string | null }
): number {
  let score = 0;
  const appliedRules = new Set<string>();

  // Build a unified context from lead state + any additional entities
  // Lead state takes priority as it's the accumulated truth
  const context: Record<string, any> = {
    nome: leadFields?.name || entities.nome,
    telefone: leadFields?.phone || entities.telefone,
    email: leadFields?.email || entities.email,
    tipoImovel: leadState.tipoImovel || entities.tipoImovel,
    regiaoInteresse: leadState.regiaoInteresse || entities.regiaoInteresse,
    orcamento: leadState.orcamentoEstimado || entities.orcamento,
    temFilhos: leadState.temFilhos !== null ? leadState.temFilhos : entities.temFilhos,
    quantosFilhos: leadState.quantosFilhos !== null ? leadState.quantosFilhos : entities.quantosFilhos,
    idadeFilhos: entities.idadeFilhos,
    urgencia: leadState.urgencia || entities.urgencia,
    motivacaoCompra: entities.motivacaoCompra,
    dataPossivelVisita: entities.dataPossivelVisita,
    perfilEstimado: leadState.perfilEstimado,
    etapa: leadState.etapa,
  };

  for (const rule of scoringRules) {
    const value = context[rule.field];
    if (rule.condition(value) && !appliedRules.has(rule.reason)) {
      score += rule.points;
      appliedRules.add(rule.reason);
    }
  }

  // Cap at 100
  return Math.min(100, score);
}

export function getScoreBreakdown(
  leadState: LeadState,
  entities: ExtractedEntities,
  leadFields?: { name?: string | null; phone?: string | null; email?: string | null }
): { score: number; breakdown: Array<{ reason: string; points: number }> } {
  let score = 0;
  const breakdown: Array<{ reason: string; points: number }> = [];

  const context: Record<string, any> = {
    nome: leadFields?.name || entities.nome,
    telefone: leadFields?.phone || entities.telefone,
    email: leadFields?.email || entities.email,
    tipoImovel: leadState.tipoImovel || entities.tipoImovel,
    regiaoInteresse: leadState.regiaoInteresse || entities.regiaoInteresse,
    orcamento: leadState.orcamentoEstimado || entities.orcamento,
    temFilhos: leadState.temFilhos !== null ? leadState.temFilhos : entities.temFilhos,
    quantosFilhos: leadState.quantosFilhos !== null ? leadState.quantosFilhos : entities.quantosFilhos,
    idadeFilhos: entities.idadeFilhos,
    urgencia: leadState.urgencia || entities.urgencia,
    motivacaoCompra: entities.motivacaoCompra,
    dataPossivelVisita: entities.dataPossivelVisita,
    perfilEstimado: leadState.perfilEstimado,
    etapa: leadState.etapa,
  };

  for (const rule of scoringRules) {
    const value = context[rule.field];
    if (rule.condition(value)) {
      score += rule.points;
      breakdown.push({ reason: rule.reason, points: rule.points });
    }
  }

  return {
    score: Math.min(100, score),
    breakdown,
  };
}

export function getQualificationLevel(score: number): string {
  if (score >= 80) return 'Hot Lead - Pronto para contato imediato';
  if (score >= 60) return 'Warm Lead - Qualificado, acompanhar';
  if (score >= 40) return 'Morno - Em qualificação';
  if (score >= 20) return 'Frio - Início de conversa';
  return 'Muito Frio - Pouca informação';
}

export function shouldEscalateToBroker(score: number, state: LeadState): boolean {
  // Auto-escalate if score is high enough
  if (score >= 70) return true;
  
  // Escalate if explicitly marked as ready
  if (state.prontoParaCorretor) return true;
  
  // Escalate if in scheduling stage
  if (state.etapa === 'agendamento') return true;
  
  return false;
}
