import { registerSSEConnection, unregisterSSEConnection, startHeartbeat } from '../../services/notification/sseManager';
import { authenticateBroker } from '../middleware/auth';
import { logger } from '../../utils/logger';

let heartbeatInterval: NodeJS.Timeout | null = null;

export async function sseRoutes(fastify: any, options: any): Promise<void> {
  // Start heartbeat on first route registration
  if (!heartbeatInterval) {
    heartbeatInterval = startHeartbeat(30000);
  }
  
  // SSE endpoint for real-time updates
  fastify.get('/events', { preHandler: authenticateBroker }, async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      
      // Set SSE headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      });
      
      // Register connection
      const connectionId = registerSSEConnection(broker._id.toString(), reply.raw);
      
      // Handle client disconnect
      request.raw.on('close', () => {
        unregisterSSEConnection(connectionId);
        logger.info(`SSE connection closed: ${connectionId}`);
      });
      
      // Keep connection open
      return new Promise(() => {});
      
    } catch (error) {
      logger.error('Error in SSE route:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'SSE_ERROR',
          message: 'Failed to establish SSE connection',
        },
      });
    }
  });
}
