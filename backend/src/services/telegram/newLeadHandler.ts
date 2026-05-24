import { Broker } from '../../models/Broker';
import { Lead } from '../../models/Lead';
import { sendWelcomeMessage } from './messageSender';
import { notifyBroker } from '../notification/sseManager';
import { setLeadState } from '../../config/redis';
import { logger } from '../../utils/logger';

export interface NewLeadData {
  telegramChatId: string;
  brokerToken: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
}

export async function handleNewLead(data: NewLeadData): Promise<{ success: boolean; leadId?: string; error?: string }> {
  try {
    logger.info('Handling new lead', {
      chatId: data.telegramChatId,
      brokerToken: data.brokerToken,
    });
    
    // Find broker by deep link token
    const broker = await Broker.findByDeepLinkToken(data.brokerToken);
    
    if (!broker) {
      logger.error(`Broker not found for token: ${data.brokerToken}`);
      return {
        success: false,
        error: 'Invalid broker token',
      };
    }
    
    // Check if lead already exists
    const existingLead = await Lead.findByChatId(data.telegramChatId);
    if (existingLead) {
      logger.info(`Lead already exists: ${existingLead._id}`);
      
      // Send welcome message again
      await sendWelcomeMessage(data.telegramChatId, broker.name);
      
      return {
        success: true,
        leadId: existingLead._id.toString(),
      };
    }
    
    // Create new lead
    const lead = await Lead.create({
      brokerId: broker._id,
      telegramChatId: data.telegramChatId,
      name: data.firstName,
      state: {
        perfilEstimado: 'Indefinido',
        temFilhos: null,
        quantosFilhos: null,
        dorPrincipal: null,
        orcamentoEstimado: null,
        regiaoInteresse: null,
        tipoImovel: null,
        urgencia: null,
        agenteAtual: 'SDR_Geral',
        prontoParaCorretor: false,
        etapa: 'inicio',
      },
      score: 0,
      lastInteractionAt: new Date(),
      firstInteractionAt: new Date(),
      totalMessages: 0,
      isActive: true,
      claimedByBroker: false,
      tags: [],
    });
    
    // Cache lead state in Redis
    await setLeadState(lead._id.toString(), {
      leadId: lead._id,
      brokerId: lead.brokerId,
      state: lead.state,
      score: lead.score,
      name: lead.name,
    });
    
    logger.info(`New lead created successfully: ${lead._id}`, {
      brokerId: broker._id,
      brokerName: broker.name,
    });
    
    // Send welcome message via Telegram
    await sendWelcomeMessage(data.telegramChatId, broker.name);
    
    // Notify broker via SSE
    await notifyBroker(broker._id.toString(), {
      type: 'new_lead',
      timestamp: new Date().toISOString(),
      data: {
        leadId: lead._id,
        leadName: lead.name,
        telegramChatId: data.telegramChatId,
        score: lead.score,
        source: 'telegram_deep_link',
      },
    });
    
    return {
      success: true,
      leadId: lead._id.toString(),
    };
  } catch (error) {
    logger.error('Error handling new lead:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function generateDeepLink(brokerId: string): Promise<{ success: boolean; deepLink?: string; token?: string; error?: string }> {
  try {
    const broker = await Broker.findById(brokerId);
    
    if (!broker) {
      return {
        success: false,
        error: 'Broker not found',
      };
    }
    
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'clavisapp_bot';
    const deepLink = `https://t.me/${botUsername}?start=${broker.deepLinkToken}`;
    
    return {
      success: true,
      deepLink,
      token: broker.deepLinkToken,
    };
  } catch (error) {
    logger.error('Error generating deep link:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
