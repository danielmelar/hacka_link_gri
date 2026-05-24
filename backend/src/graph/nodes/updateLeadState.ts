import { Lead } from '../../models/Lead';
import { Message } from '../../models/Message';
import { setLeadState } from '../../config/redis';
import { calculateScore } from '../../utils/scoring';
import type { AgentGraphState } from '../../types';
import { logger } from '../../utils/logger';

export async function updateLeadState(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
  try {
    logger.info(`Updating lead state for ${state.leadId}`);
    
    const lead = await Lead.findById(state.leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${state.leadId}`);
    }
    
    const { extractedEntities } = state;
    const previousState = { ...lead.state };
    let stateChanged = false;
    
    // Update lead fields from entities
    if (extractedEntities.nome && !lead.name) {
      lead.name = extractedEntities.nome;
    }
    
    if (extractedEntities.telefone && !lead.phone) {
      lead.phone = extractedEntities.telefone;
    }
    
    if (extractedEntities.email && !lead.email) {
      lead.email = extractedEntities.email;
    }
    
    // Update state fields
    if (extractedEntities.temFilhos !== undefined) {
      lead.state.temFilhos = extractedEntities.temFilhos;
      stateChanged = true;
    }
    
    if (extractedEntities.quantosFilhos !== undefined) {
      lead.state.quantosFilhos = extractedEntities.quantosFilhos;
      stateChanged = true;
    }
    
    if (extractedEntities.orcamento) {
      lead.state.orcamentoEstimado = extractedEntities.orcamento;
      stateChanged = true;
    }
    
    if (extractedEntities.regiaoInteresse) {
      lead.state.regiaoInteresse = extractedEntities.regiaoInteresse;
      stateChanged = true;
    }
    
    if (extractedEntities.tipoImovel) {
      lead.state.tipoImovel = extractedEntities.tipoImovel;
      stateChanged = true;
    }
    
    if (extractedEntities.urgencia) {
      lead.state.urgencia = extractedEntities.urgencia;
      stateChanged = true;
    }
    
    // Recalculate profile if relevant fields changed
    if (stateChanged) {
      const newProfile = lead.calculateProfile();
      if (newProfile !== lead.state.perfilEstimado) {
        lead.state.perfilEstimado = newProfile;
        logger.info(`Lead ${lead._id} profile changed to ${newProfile}`);
      }
    }
    
    // Calculate and update score
    const newScore = calculateScore(lead.state, extractedEntities);
    if (newScore !== lead.score) {
      lead.updateScore(newScore, 'Atualização automática baseada em novas informações');
    }
    
    // Update interaction stats
    lead.lastInteractionAt = new Date();
    lead.totalMessages += 1;
    
    // Check if ready for broker
    if (newScore >= 70 && !lead.state.prontoParaCorretor) {
      lead.state.prontoParaCorretor = true;
      lead.state.etapa = 'agendamento';
      logger.info(`Lead ${lead._id} is now ready for broker contact`);
    }
    
    // Save lead
    await lead.save();
    
    // Update cache
    await setLeadState(lead._id.toString(), {
      leadId: lead._id,
      brokerId: lead.brokerId,
      state: lead.state,
      score: lead.score,
      name: lead.name,
    });
    
    // Save inbound message
    const lastMessage = state.messages[state.messages.length - 1];
    await Message.create({
      leadId: lead._id,
      brokerId: lead.brokerId,
      direction: 'inbound',
      type: 'text',
      content: lastMessage.content,
      metadata: {
        entities: extractedEntities,
        stateChanged,
      },
      status: 'read',
    });
    
    logger.info(`Lead state updated successfully`, {
      leadId: lead._id,
      score: lead.score,
      profile: lead.state.perfilEstimado,
      agent: lead.state.agenteAtual,
    });
    
    return {
      metadata: {
        ...state.metadata,
        stateChanged,
        previousAgent: previousState.agenteAtual,
        newScore: lead.score,
      },
    };
  } catch (error) {
    logger.error('Error updating lead state:', error);
    throw error;
  }
}
