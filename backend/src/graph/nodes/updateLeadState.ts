import { Lead } from '../../models/Lead';
import { Message } from '../../models/Message';
import { setLeadState } from '../../config/redis';
import { calculateScore } from '../../utils/scoring';
import type { AgentGraphState } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Determine the next stage based on how many qualification fields are filled.
 */
function determineNextStage(state: AgentGraphState['extractedEntities'], leadState: any): string {
  const filledFields = [
    leadState.tipoImovel,
    leadState.regiaoInteresse,
    leadState.orcamentoEstimado,
    leadState.temFilhos !== null ? 'yes' : null,
    leadState.urgencia,
  ].filter(Boolean).length;

  const currentEtapa = leadState.etapa;

  // Don't go backwards
  if (currentEtapa === 'agendamento' || currentEtapa === 'fechamento') {
    return currentEtapa;
  }

  if (filledFields >= 4) return 'apresentacao';
  if (filledFields >= 2) return 'qualificacao';
  return 'inicio';
}

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
    const changesLog: string[] = [];

    // Update lead fields from entities (only if not already set)
    if (extractedEntities.nome && !lead.name) {
      lead.name = extractedEntities.nome;
      changesLog.push(`name: ${extractedEntities.nome}`);
    }

    if (extractedEntities.telefone && !lead.phone) {
      lead.phone = extractedEntities.telefone;
      changesLog.push(`phone set`);
    }

    if (extractedEntities.email && !lead.email) {
      lead.email = extractedEntities.email;
      changesLog.push(`email set`);
    }

    // Update state fields - only when explicitly provided (not null/undefined)
    if (extractedEntities.temFilhos !== undefined && extractedEntities.temFilhos !== null) {
      if (lead.state.temFilhos !== extractedEntities.temFilhos) {
        lead.state.temFilhos = extractedEntities.temFilhos;
        stateChanged = true;
        changesLog.push(`temFilhos: ${extractedEntities.temFilhos}`);
      }
    }

    if (extractedEntities.quantosFilhos !== undefined && extractedEntities.quantosFilhos !== null) {
      if (lead.state.quantosFilhos !== extractedEntities.quantosFilhos) {
        lead.state.quantosFilhos = extractedEntities.quantosFilhos;
        stateChanged = true;
        changesLog.push(`quantosFilhos: ${extractedEntities.quantosFilhos}`);
      }
    }

    if (extractedEntities.orcamento) {
      if (lead.state.orcamentoEstimado !== extractedEntities.orcamento) {
        lead.state.orcamentoEstimado = extractedEntities.orcamento;
        stateChanged = true;
        changesLog.push(`orcamento: ${extractedEntities.orcamento}`);
      }
    }

    if (extractedEntities.regiaoInteresse) {
      if (lead.state.regiaoInteresse !== extractedEntities.regiaoInteresse) {
        lead.state.regiaoInteresse = extractedEntities.regiaoInteresse;
        stateChanged = true;
        changesLog.push(`regiao: ${extractedEntities.regiaoInteresse}`);
      }
    }

    if (extractedEntities.tipoImovel) {
      if (lead.state.tipoImovel !== extractedEntities.tipoImovel) {
        lead.state.tipoImovel = extractedEntities.tipoImovel;
        stateChanged = true;
        changesLog.push(`tipoImovel: ${extractedEntities.tipoImovel}`);
      }
    }

    if (extractedEntities.urgencia) {
      if (lead.state.urgencia !== extractedEntities.urgencia) {
        lead.state.urgencia = extractedEntities.urgencia;
        stateChanged = true;
        changesLog.push(`urgencia: ${extractedEntities.urgencia}`);
      }
    }

    if (extractedEntities.motivacaoCompra) {
      if (lead.state.dorPrincipal !== extractedEntities.motivacaoCompra) {
        lead.state.dorPrincipal = extractedEntities.motivacaoCompra;
        stateChanged = true;
        changesLog.push(`motivacao: ${extractedEntities.motivacaoCompra}`);
      }
    }

    // Recalculate profile if relevant fields changed
    let profileChanged = false;
    if (stateChanged) {
      const newProfile = lead.calculateProfile();
      if (newProfile !== lead.state.perfilEstimado) {
        lead.state.perfilEstimado = newProfile;
        profileChanged = true;
        changesLog.push(`profile: ${newProfile}`);
        logger.info(`Lead ${lead._id} profile changed to ${newProfile}`);
      }
    }

    // Progress stage automatically based on accumulated data
    const nextStage = determineNextStage(extractedEntities, lead.state);
    if (nextStage !== lead.state.etapa) {
      lead.state.etapa = nextStage as any;
      stateChanged = true;
      changesLog.push(`etapa: ${nextStage}`);
      logger.info(`Lead ${lead._id} advanced to stage: ${nextStage}`);
    }

    // Calculate and update score using the COMPLETE accumulated state
    const newScore = calculateScore(lead.state, extractedEntities, {
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
    });
    const previousScore = lead.score;
    if (newScore !== lead.score) {
      lead.updateScore(newScore, `Novos dados: ${changesLog.join(', ') || 'interação'}`);
      changesLog.push(`score: ${previousScore} → ${newScore}`);
    }

    // Update interaction stats
    lead.lastInteractionAt = new Date();
    lead.totalMessages += 1;

    // Check if ready for broker
    if (newScore >= 70 && !lead.state.prontoParaCorretor) {
      lead.state.prontoParaCorretor = true;
      lead.state.etapa = 'agendamento';
      changesLog.push('prontoParaCorretor: true');
      logger.info(`Lead ${lead._id} is now ready for broker contact`);
    }

    // Save suggested properties from the graph state (if any from previous runs)
    if (state.suggestedProperties && state.suggestedProperties.length > 0) {
      const existing = new Set(lead.suggestedPropertyIds?.map(String) || []);
      const newIds = state.suggestedProperties.filter(id => !existing.has(id));
      if (newIds.length > 0) {
        lead.suggestedPropertyIds = [...existing, ...newIds] as any;
        changesLog.push(`suggestedProperties: +${newIds.length}`);
      }
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
        changes: changesLog,
      },
      status: 'read',
    });

    logger.info(`Lead state updated successfully`, {
      leadId: lead._id,
      score: lead.score,
      previousScore,
      profile: lead.state.perfilEstimado,
      agent: lead.state.agenteAtual,
      etapa: lead.state.etapa,
      changes: changesLog,
    });

    return {
      metadata: {
        ...state.metadata,
        stateChanged,
        profileChanged,
        previousAgent: previousState.agenteAtual,
        newScore: lead.score,
        previousScore,
        changes: changesLog,
      },
    };
  } catch (error) {
    logger.error('Error updating lead state:', error);
    throw error;
  }
}
