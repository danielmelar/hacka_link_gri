import Fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDatabase } from '../config/database';
import { initializeBot, setWebhook } from '../services/telegram/bot';
import { initializeVectorStore } from '../services/rag/vectorStore';
import { cleanupAllConnections } from '../services/notification/sseManager';
import { closeRedis } from '../config/redis';
import { logger } from '../utils/logger';
import { PORT, API_URL, TELEGRAM_WEBHOOK_URL, NODE_ENV } from '../config/env';

// Import routes
import { healthRoutes } from './routes/health';
import { telegramWebhookRoute } from './routes/webhook';
import { sseRoutes } from './routes/sse';
import { dashboardRoutes } from './routes/dashboard';
import { propertyRoutes } from './routes/properties';
import { authRoutes } from './routes/auth';
import { analyticsRoutes } from './routes/analytics';
import { followUpRoutes } from './routes/followUps';
import { settingsRoutes } from './routes/settings';

// Create Fastify instance
const app = Fastify({
  logger: NODE_ENV === 'development',
});

// Register plugins
async function registerPlugins(): Promise<void> {
  // CORS
  await app.register(cors, {
    origin: NODE_ENV === 'development' 
      ? ['http://localhost:5173', 'http://localhost:3000', true] 
      : [/\.linkgri\.com$/, /\.clavis\.com$/, 'http://localhost:3000'],
    credentials: true,
  });
  
  // Request logging
  app.addHook('onRequest', async (request, reply) => {
    request.log.info({
      method: request.method,
      url: request.url,
      ip: request.ip,
    }, 'incoming request');
  });
}

// Register routes
async function registerRoutes(): Promise<void> {
  // Health check (public)
  await app.register(healthRoutes, { prefix: '/health' });
  
  // Telegram webhook (public, but validated by Telegram token)
  await app.register(telegramWebhookRoute, { prefix: '/webhook' });
  
  // Auth (public)
  await app.register(authRoutes, { prefix: '/api' });

  // SSE events (authenticated)
  await app.register(sseRoutes, { prefix: '/api/events' });
  
  // Dashboard API (authenticated)
  await app.register(dashboardRoutes, { prefix: '/api' });

  // Properties API (authenticated)
  await app.register(propertyRoutes, { prefix: '/api' });

  // Analytics API (authenticated)
  await app.register(analyticsRoutes, { prefix: '/api' });

  // Follow-ups API (authenticated)
  await app.register(followUpRoutes, { prefix: '/api' });

  // Settings API (authenticated)
  await app.register(settingsRoutes, { prefix: '/api' });
  
  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${request.method}:${request.url} not found`,
      },
    });
  });
  
  // Error handler
  app.setErrorHandler((error, request, reply) => {
    logger.error('Request error:', error);
    
    reply.status(error.statusCode || 500).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: NODE_ENV === 'production' 
          ? 'Internal server error' 
          : error.message,
      },
    });
  });
}

// Initialize services
async function initializeServices(): Promise<void> {
  // Connect to MongoDB
  await connectDatabase();
  
  // Initialize Telegram bot
  await initializeBot();
  
  // Set webhook if URL is provided
  if (TELEGRAM_WEBHOOK_URL) {
    await setWebhook(TELEGRAM_WEBHOOK_URL);
  }
  
  // Initialize vector store (optional)
  initializeVectorStore();
}

// Start server
async function startServer(): Promise<void> {
  try {
    await registerPlugins();
    await registerRoutes();
    await initializeServices();
    
    await app.listen({ port: PORT, host: '0.0.0.0' });
    
    logger.info(`🚀 Server running on ${API_URL}`);
    logger.info(`📊 Health check: ${API_URL}/health`);
    logger.info(`🔗 Webhook: ${API_URL}/webhook/telegram`);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close SSE connections
    cleanupAllConnections();
    
    // Close Redis
    await closeRedis();
    
    // Close Fastify
    await app.close();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();

export { app };
