import { sendMessage, sendPhoto, sendTyping } from './bot';
import { logger } from '../../utils/logger';

export interface SendMessageResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: { withTyping?: boolean; parseMarkdown?: boolean } = {}
): Promise<SendMessageResult> {
  const { withTyping = true, parseMarkdown = true } = options;
  
  try {
    // Send typing indicator
    if (withTyping) {
      await sendTyping(chatId);
      // Small delay to simulate typing
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Send message
    const result = await sendMessage(
      chatId,
      text,
      parseMarkdown ? { parse_mode: 'Markdown' } : {}
    );
    
    if (!result.success) {
      throw new Error('Failed to send message');
    }
    
    logger.info(`Message sent to ${chatId}`, { messageId: result.messageId });
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    const errorMessage = (error as Error).message;
    logger.error(`Error sending message to ${chatId}:`, error);
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function sendPropertySuggestion(
  chatId: string,
  property: {
    title: string;
    price: string;
    imageUrl?: string;
    description: string;
    details: string;
  }
): Promise<SendMessageResult> {
  try {
    const caption = `*${property.title}*\n\n💰 ${property.price}\n\n${property.description}\n\n${property.details}`;
    
    if (property.imageUrl) {
      const result = await sendPhoto(chatId, property.imageUrl, caption);
      return {
        success: result.success,
        messageId: result.messageId,
      };
    } else {
      return sendTelegramMessage(chatId, caption);
    }
  } catch (error) {
    logger.error(`Error sending property suggestion to ${chatId}:`, error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export async function sendWelcomeMessage(
  chatId: string,
  brokerName: string
): Promise<SendMessageResult> {
  const message = `Olá! 👋 Sou a **Sofia**, sua consultora imobiliária da LinkGRI.

Estou aqui para ajudar você a encontrar o imóvel ideal. Fui designada pelo corretor **${brokerName}** para entender suas necessidades e apresentar as melhores opções do portfólio dele. 🏠

Vamos começar? Me conta: você está procurando um imóvel para **morar** ou como **investimento**? 😊`;

  return sendTelegramMessage(chatId, message);
}

export async function sendErrorMessage(
  chatId: string
): Promise<SendMessageResult> {
  const message = `Desculpe, tive um problema técnico. 😔

Pode tentar enviar sua mensagem novamente? Estou aqui para ajudar!`;

  return sendTelegramMessage(chatId, message, { withTyping: false });
}

export async function sendHandoffMessage(
  chatId: string,
  brokerName: string
): Promise<SendMessageResult> {
  const message = `Perfeito! 🎯

Parece que temos ótimas opções para você! Vou encaminhar nossa conversa para o corretor **${brokerName}**, que entrará em contato em breve para agendar uma visita ou conversa mais detalhada.

Foi um prazer te ajudar! 💙`;

  return sendTelegramMessage(chatId, message);
}
