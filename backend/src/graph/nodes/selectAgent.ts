import { Lead } from '../../models/Lead';
import { selectAgent as selectAgentConfig } from '../../agents/config';
import type { AgentGraphState, AgenteAtual } from '../../types';
import { logger } from '../../utils/logger';

export async function selectAgent(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
  try {
    logger.info(`Selecting agent for lead ${state.leadId}`);
    
    const lead = await Lead.findById(state.leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${state.leadId}`);
    }
    
    // Build context for agent selection
    const context = {
      ...lead.state,
      ...state.extractedEntities,
      score: lead.score,
      etapa: lead.state.etapa,
    };
    
    // Select agent based on rules
    const selectedAgentKey = selectAgentConfig(context);
    
    // Map agent key to AgenteAtual type
    const agentMapping: Record<string, AgenteAtual> = {
      sofia: 'SDR_Geral',
      especialista_familia: 'Especialista_Familia',
      especialista_alto_padrao: 'Especialista_Alto_Padrao',
    };
    
    const newAgent = agentMapping[selectedAgentKey] || 'SDR_Geral';
    const previousAgent = lead.state.agenteAtual;
    
    // Update lead if agent changed
    if (newAgent !== previousAgent) {
      lead.state.agenteAtual = newAgent;
      await lead.save();
      
      logger.info(`Agent changed for lead ${lead._id}: ${previousAgent} -> ${newAgent}`);
    }
    
    return {
      currentAgent: selectedAgentKey as 'sofia' | 'especialista_familia' | 'especialista_alto_padrao',
      metadata: {
        ...state.metadata,
        agentChanged: newAgent !== previousAgent,
        previousAgent,
        newAgent,
      },
    };
  } catch (error) {
    logger.error('Error selecting agent:', error);
    // Default to sofia on error
    return {
      currentAgent: 'sofia',
    };
  }
}
