import { Telegraf } from 'telegraf';
import { TELEGRAM_BOT_TOKEN } from '../../config/env';
import { logger } from '../../utils/logger';

// Initialize bot
export const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// Bot initialization
export async function initializeBot(): Promise<void> {
  try {
    // Get bot info
    const botInfo = await bot.telegram.getMe();
    logger.info(`🤖 Telegram Bot initialized: @${botInfo.username}`);
    
    // Set up error handler
    bot.catch((err, ctx) => {
      logger.error(`Telegram error for ${ctx.updateType}:`, err);
    });
    
  } catch (error) {
    logger.error('Failed to initialize Telegram bot:', error);
    throw error;
  }
}

// Set webhook
export async function setWebhook(webhookUrl: string): Promise<void> {
  try {
    await bot.telegram.setWebhook(webhookUrl, {
      allowed_updates: ['message', 'callback_query', 'edited_message'],
    });
    
    const webhookInfo = await bot.telegram.getWebhookInfo();
    logger.info('✅ Webhook set successfully', {
      url: webhookInfo.url,
      pendingUpdates: webhookInfo.pending_update_count,
    });
  } catch (error) {
    logger.error('Failed to set webhook:', error);
    throw error;
  }
}

// Delete webhook (for polling mode)
export async function deleteWebhook(): Promise<void> {
  try {
    await bot.telegram.deleteWebhook();
    logger.info('Webhook deleted');
  } catch (error) {
    logger.error('Failed to delete webhook:', error);
    throw error;
  }
}

// Get bot info
export async function getBotInfo() {
  return bot.telegram.getMe();
}

// Send message
export async function sendMessage(
  chatId: string | number,
  text: string,
  options: any = {}
): Promise<{ messageId: number; success: boolean }> {
  try {
    const result = await bot.telegram.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      ...options,
    });
    
    return {
      messageId: result.message_id,
      success: true,
    };
  } catch (error) {
    logger.error('Error sending Telegram message:', error);
    return {
      messageId: 0,
      success: false,
    };
  }
}

// Send photo
export async function sendPhoto(
  chatId: string | number,
  photoUrl: string,
  caption?: string
): Promise<{ messageId: number; success: boolean }> {
  try {
    const result = await bot.telegram.sendPhoto(chatId, photoUrl, {
      caption,
      parse_mode: 'Markdown',
    });
    
    return {
      messageId: result.message_id,
      success: true,
    };
  } catch (error) {
    logger.error('Error sending Telegram photo:', error);
    return {
      messageId: 0,
      success: false,
    };
  }
}

// Send typing action
export async function sendTyping(chatId: string | number): Promise<void> {
  try {
    await bot.telegram.sendChatAction(chatId, 'typing');
  } catch (error) {
    logger.error('Error sending typing action:', error);
  }
}
