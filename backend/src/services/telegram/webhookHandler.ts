import { Broker } from '../../models/Broker';
import { Lead } from '../../models/Lead';
import { sendWelcomeMessage, sendErrorMessage } from './messageSender';
import { processMessage } from '../../graph';
import { notifyBroker } from '../notification/sseManager';
import { setLeadState } from '../../config/redis';
import type { TelegramUpdate } from '../../types';
import { logger } from '../../utils/logger';

export async function handleTelegramWebhook(update: TelegramUpdate): Promise<void> {
  try {
    logger.info('Received Telegram webhook', { updateId: update.update_id });
    
    // Handle callback queries (buttons)
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }
    
    // Handle messages
    if (!update.message) {
      logger.warn('No message in update');
      return;
    }
    
    const { message } = update;
    const chatId = message.chat.id.toString();
    const text = message.text || '';
    const from = message.from;
    
    // Handle /start command with deep link
    if (text.startsWith('/start ')) {
      await handleStartCommand(chatId, text, from);
      return;
    }
    
    // Handle simple /start without parameter
    if (text === '/start') {
      await handleSimpleStart(chatId);
      return;
    }
    
    // Handle regular message - find existing lead
    const lead = await Lead.findByChatId(chatId);
    
    if (!lead) {
      logger.warn(`No lead found for chat ${chatId}`);
      await sendErrorMessage(chatId);
      return;
    }
    
    // Process message through agent graph
    await processExistingLeadMessage(lead, text);
    
  } catch (error) {
    logger.error('Error handling Telegram webhook:', error);
    throw error;
  }
}

async function handleStartCommand(
  chatId: string,
  text: string,
  from: any
): Promise<void> {
  // Extract broker token from /start <token>
  const brokerToken = text.replace('/start ', '').trim();
  
  logger.info(`New lead starting with token: ${brokerToken}`, {
    chatId,
    firstName: from?.first_name,
  });
  
  // Find broker by deep link token
  const broker = await Broker.findByDeepLinkToken(brokerToken);
  
  if (!broker) {
    logger.error(`Broker not found for token: ${brokerToken}`);
    // Send error message to user
    const { sendMessage } = await import('./bot');
    await sendMessage(
      chatId,
      'Desculpe, este link parece ser inválido ou expirado. Por favor, entre em contato com o corretor diretamente.'
    );
    return;
  }
  
  // Check if lead already exists
  const existingLead = await Lead.findByChatId(chatId);
  if (existingLead) {
    logger.info(`Lead already exists for chat ${chatId}`);
    // Just send welcome message again
    await sendWelcomeMessage(chatId, broker.name);
    return;
  }
  
  // Create new lead
  const lead = await Lead.create({
    brokerId: broker._id,
    telegramChatId: chatId,
    name: from?.first_name,
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
  
  // Cache lead state
  await setLeadState(lead._id.toString(), {
    leadId: lead._id,
    brokerId: lead.brokerId,
    state: lead.state,
    score: lead.score,
    name: lead.name,
  });
  
  logger.info(`New lead created: ${lead._id}`, {
    brokerId: broker._id,
    brokerName: broker.name,
  });
  
  // Send welcome message
  await sendWelcomeMessage(chatId, broker.name);
  
  // Notify broker via SSE
  await notifyBroker(broker._id.toString(), {
    type: 'new_lead',
    timestamp: new Date().toISOString(),
    data: {
      leadId: lead._id,
      leadName: lead.name,
      telegramChatId: chatId,
      score: lead.score,
      source: 'telegram_deep_link',
    },
  });
}

async function handleSimpleStart(chatId: string): Promise<void> {
  const { sendMessage } = await import('./bot');
  await sendMessage(
    chatId,
    'Olá! 👋 Para começar, por favor use o link exclusivo do seu corretor ou entre em contato com ele diretamente.'
  );
}

async function processExistingLeadMessage(lead: any, text: string): Promise<void> {
  logger.info(`Processing message from lead ${lead._id}`, {
    messageLength: text.length,
    currentAgent: lead.state.agenteAtual,
  });
  
  // Get recent conversation history for context
  const { Message } = await import('../../models/Message');
  const recentMessages = await Message.getRecentForContext(lead._id.toString(), 10);
  
  const conversationHistory = recentMessages.reverse().map((m: any) => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.content,
  }));
  
  // Process through agent graph
  await processMessage(
    lead._id.toString(),
    lead.brokerId.toString(),
    text,
    conversationHistory
  );
}

async function handleCallbackQuery(callbackQuery: any): Promise<void> {
  logger.info('Received callback query', { data: callbackQuery.data });
  
  // Handle button clicks here
  // For now, just acknowledge
  const { bot } = await import('./bot');
  await bot.telegram.answerCbQuery(callbackQuery.id);
}
