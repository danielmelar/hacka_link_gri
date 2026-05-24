import { readFileSync } from 'fs';
import { join } from 'path';
import type { AgenteAtual } from '../types';

export interface AgentConfig {
  name: string;
  type: AgenteAtual;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: string;
  triggers: {
    condition: string;
    priority: number;
  }[];
}

// Load prompts from markdown files
function loadPrompt(filename: string): string {
  try {
    const path = join(__dirname, 'prompts', filename);
    return readFileSync(path, 'utf-8');
  } catch (error) {
    console.error(`Failed to load prompt ${filename}:`, error);
    return '';
  }
}

export const agents: Record<string, AgentConfig> = {
  sofia: {
    name: 'Sofia',
    type: 'SDR_Geral',
    systemPrompt: loadPrompt('sofia-sdr.md'),
    temperature: 0.7,
    maxTokens: 800,
    model: 'gpt-4o-mini',
    triggers: [
      { condition: 'default', priority: 0 },
      { condition: 'etapa === "inicio"', priority: 10 },
      { condition: 'etapa === "qualificacao"', priority: 10 },
    ],
  },
  
  especialista_familia: {
    name: 'Especialista em Famílias',
    type: 'Especialista_Familia',
    systemPrompt: loadPrompt('especialista-familia.md'),
    temperature: 0.75,
    maxTokens: 800,
    model: 'gpt-4o-mini',
    triggers: [
      { condition: 'temFilhos === true', priority: 100 },
      { condition: 'quantosFilhos > 0', priority: 100 },
      { condition: 'targetProfile.includes("familia")', priority: 50 },
    ],
  },
  
  especialista_alto_padrao: {
    name: 'Especialista em Alto Padrão',
    type: 'Especialista_Alto_Padrao',
    systemPrompt: loadPrompt('especialista-alto-padrao.md'),
    temperature: 0.6,
    maxTokens: 900,
    model: 'gpt-4o', // Use stronger model for high-value clients
    triggers: [
      { condition: 'perfilEstimado === "AltoPadrao"', priority: 100 },
      { condition: 'orcamento > 1000000', priority: 90 },
      { condition: 'tipoImovel === "cobertura"', priority: 80 },
      { condition: 'tipoImovel === "flat"', priority: 80 },
    ],
  },
};

// Agent selection logic
export function selectAgent(state: any): string {
  const scores: Record<string, number> = {};
  
  // Calculate score for each agent based on triggers
  for (const [agentKey, config] of Object.entries(agents)) {
    scores[agentKey] = 0;
    
    for (const trigger of config.triggers) {
      if (evaluateCondition(trigger.condition, state)) {
        scores[agentKey] += trigger.priority;
      }
    }
  }
  
  // Return agent with highest score
  const selectedAgent = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)[0];
  
  return selectedAgent?.[0] || 'sofia';
}

// Simple condition evaluator
function evaluateCondition(condition: string, state: any): boolean {
  // Handle 'default' condition
  if (condition === 'default') return true;
  
  try {
    // Replace state variables with actual values
    const context = {
      ...state,
      ...state.state, // Nested state object
    };
    
    // Create safe evaluation function
    const fn = new Function(...Object.keys(context), `return ${condition}`);
    return fn(...Object.values(context));
  } catch (error) {
    return false;
  }
}

// Get agent config by key
export function getAgentConfig(agentKey: string): AgentConfig {
  return agents[agentKey] || agents.sofia;
}

// Get agent config by type
export function getAgentConfigByType(type: AgenteAtual): AgentConfig {
  const mapping: Record<AgenteAtual, string> = {
    'SDR_Geral': 'sofia',
    'Especialista_Familia': 'especialista_familia',
    'Especialista_Alto_Padrao': 'especialista_alto_padrao',
  };
  
  return agents[mapping[type]] || agents.sofia;
}
