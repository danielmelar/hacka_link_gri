import type { LeadState, ExtractedEntities } from '../types';

interface ScoringRule {
  field: keyof LeadState | keyof ExtractedEntities;
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
  
  // Urgency and motivation
  { field: 'urgencia', condition: (v) => v === 'alta', points: 15, reason: 'Urgência alta' },
  { field: 'urgencia', condition: (v) => v === 'media', points: 10, reason: 'Urgência média' },
  { field: 'motivacaoCompra', condition: (v) => !!v, points: 10, reason: 'Motivação de compra informada' },
  
  // Profile
  { field: 'perfilEstimado', condition: (v) => v !== 'Indefinido', points: 10, reason: 'Perfil estimado definido' },
];

export function calculateScore(
  leadState: LeadState,
  entities: ExtractedEntities
): number {
  let score = 0;
  const appliedRules: string[] = [];
  
  // Combine state and entities for scoring
  const context = {
    ...leadState,
    ...entities,
  };
  
  for (const rule of scoringRules) {
    const value = context[rule.field];
    if (rule.condition(value)) {
      score += rule.points;
      appliedRules.push(rule.reason);
    }
  }
  
  // Cap at 100
  return Math.min(100, score);
}

export function getScoreBreakdown(
  leadState: LeadState,
  entities: ExtractedEntities
): { score: number; breakdown: Array<{ reason: string; points: number }> } {
  let score = 0;
  const breakdown: Array<{ reason: string; points: number }> = [];
  
  const context = {
    ...leadState,
    ...entities,
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
