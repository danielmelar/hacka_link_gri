import mongoose from 'mongoose';
import { redis } from '../../config/redis';
import { getConnectionStats } from '../../services/notification/sseManager';
import { logger } from '../../utils/logger';

export async function healthRoutes(fastify: any, options: any): Promise<void> {
  // Health check endpoint
  fastify.get('/', async (request: any, reply: any) => {
    try {
      // Check MongoDB
      const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      
      // Check Redis
      const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';
      
      // Get SSE stats
      const sseStats = getConnectionStats();
      
      const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';
      
      const statusCode = isHealthy ? 200 : 503;
      
      reply.status(statusCode).send({
        success: isHealthy,
        data: {
          status: isHealthy ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV,
          services: {
            mongodb: mongoStatus,
            redis: redisStatus,
          },
          connections: sseStats,
        },
      });
    } catch (error) {
      logger.error('Health check error:', error);
      
      reply.status(503).send({
        success: false,
        data: {
          status: 'error',
          timestamp: new Date().toISOString(),
          error: (error as Error).message,
        },
      });
    }
  });
  
  // Readiness check (for Kubernetes)
  fastify.get('/ready', async (request: any, reply: any) => {
    const isReady = mongoose.connection.readyState === 1;
    
    reply.status(isReady ? 200 : 503).send({
      ready: isReady,
    });
  });
  
  // Liveness check (for Kubernetes)
  fastify.get('/live', async (request: any, reply: any) => {
    reply.send({
      alive: true,
      timestamp: new Date().toISOString(),
    });
  });
}
