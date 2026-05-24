import { handleTelegramWebhook } from '../../services/telegram/webhookHandler';
import { logger } from '../../utils/logger';
import { checkRateLimit } from '../../config/redis';

// Telegram webhook handler
export async function telegramWebhookRoute(fastify: any, options: any): Promise<void> {
  fastify.post('/telegram', async (request: any, reply: any) => {
    try {
      // Rate limiting - max 100 requests per minute per IP
      const clientIp = request.ip;
      const rateLimitKey = `webhook:telegram:${clientIp}`;
      const allowed = await checkRateLimit(rateLimitKey, 100, 60);
      
      if (!allowed) {
        reply.status(429).send({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests',
          },
        });
        return;
      }
      
      // Process webhook
      await handleTelegramWebhook(request.body);
      
      // Always return 200 OK to Telegram
      reply.send({ ok: true });
      
    } catch (error) {
      logger.error('Error in Telegram webhook route:', error);
      
      // Still return 200 to Telegram to prevent retries
      // Log the error for monitoring
      reply.send({ ok: true });
    }
  });
}
