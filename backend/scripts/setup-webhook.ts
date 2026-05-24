#!/usr/bin/env tsx
/**
 * Setup Telegram webhook script
 * Run this after deploying to set the webhook URL
 */

import { initializeBot, setWebhook, deleteWebhook, getBotInfo } from '../src/services/telegram/bot';
import { logger } from '../src/utils/logger';

const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL;

async function setupWebhook(): Promise<void> {
  try {
    logger.info('🔧 Setting up Telegram webhook...');
    
    // Initialize bot
    await initializeBot();
    
    // Get bot info
    const botInfo = await getBotInfo();
    logger.info(`Bot: @${botInfo.username}`);
    
    if (!WEBHOOK_URL) {
      logger.error('❌ TELEGRAM_WEBHOOK_URL environment variable is not set');
      logger.info('');
      logger.info('To set the webhook, run:');
      logger.info('  TELEGRAM_WEBHOOK_URL=https://your-domain.com/webhook/telegram npx tsx scripts/setup-webhook.ts');
      process.exit(1);
    }
    
    // Set webhook
    await setWebhook(WEBHOOK_URL);
    
    logger.info('✅ Webhook setup completed successfully!');
    logger.info(`   URL: ${WEBHOOK_URL}`);
    
  } catch (error) {
    logger.error('❌ Failed to setup webhook:', error);
    process.exit(1);
  }
}

async function removeWebhook(): Promise<void> {
  try {
    logger.info('🗑️ Removing Telegram webhook...');
    
    await initializeBot();
    await deleteWebhook();
    
    logger.info('✅ Webhook removed successfully!');
    logger.info('   Bot will now use polling mode (if implemented)');
    
  } catch (error) {
    logger.error('❌ Failed to remove webhook:', error);
    process.exit(1);
  }
}

// Main
const command = process.argv[2];

if (command === 'remove' || command === 'delete') {
  removeWebhook();
} else {
  setupWebhook();
}
