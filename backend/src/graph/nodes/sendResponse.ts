import { Lead } from '../../models/Lead';
import { Message } from '../../models/Message';
import { sendTelegramMessage } from '../../services/telegram/messageSender';
import { notifyBroker } from '../../services/notification/sseManager';
import type { AgentGraphState } from '../../types';
import { logger } from '../../utils/logger';

export async function sendResponse(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
  try {
    logger.info(`Sending response for lead ${state.leadId}`);
    
    const lead = await Lead.findById(state.leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${state.leadId}`);
    }
    
    // Send message to Telegram
    const telegramResult = await sendTelegramMessage(
      lead.telegramChatId,
      state.response
    );
    
    // Save outbound message to database
    const message = await Message.create({
      leadId: lead._id,
      brokerId: lead.brokerId,
      direction: 'outbound',
      type: 'text',
      content: state.response,
      metadata: {
        agentName: state.currentAgent,
        agentType: state.currentAgent,
        propertiesSuggested: state.suggestedProperties,
        processingTimeMs: state.metadata?.generationTimeMs,
        tokensUsed: state.metadata?.tokensUsed,
        modelUsed: state.metadata?.modelUsed,
      },
      status: telegramResult.success ? 'sent' : 'failed',
      telegramMessageId: telegramResult.messageId,
      sentAt: new Date(),
    });
    
    // Notify broker via SSE
    await notifyBroker(lead.brokerId.toString(), {
      type: 'message_received',
      timestamp: new Date().toISOString(),
      data: {
        leadId: lead._id,
        leadName: lead.name,
        messageId: message._id,
        direction: 'outbound',
        content: state.response.substring(0, 100) + (state.response.length > 100 ? '...' : ''),
        agent: state.currentAgent,
        score: lead.score,
      },
    });
    
    // If lead became ready for broker, send special notification
    if (state.metadata?.newScore >= 70 && state.metadata?.stateChanged) {
      await notifyBroker(lead.brokerId.toString(), {
        type: 'lead_ready',
        timestamp: new Date().toISOString(),
        data: {
          leadId: lead._id,
          leadName: lead.name,
          score: lead.score,
          profile: lead.state.perfilEstimado,
          reason: 'Lead atingiu score de qualificação',
        },
      });
    }
    
    // If agent changed, notify
    if (state.metadata?.agentChanged) {
      await notifyBroker(lead.brokerId.toString(), {
        type: 'agent_changed',
        timestamp: new Date().toISOString(),
        data: {
          leadId: lead._id,
          leadName: lead.name,
          previousAgent: state.metadata.previousAgent,
          newAgent: state.metadata.newAgent,
        },
      });
    }
    
    logger.info(`Response sent successfully`, {
      leadId: lead._id,
      messageId: message._id,
      telegramSuccess: telegramResult.success,
    });
    
    return {
      messages: [
        ...state.messages,
        {
          role: 'assistant',
          content: state.response,
          timestamp: new Date(),
        },
      ],
      metadata: {
        ...state.metadata,
        messageId: message._id.toString(),
        telegramMessageId: telegramResult.messageId,
      },
    };
  } catch (error) {
    logger.error('Error sending response:', error);
    throw error;
  }
}
