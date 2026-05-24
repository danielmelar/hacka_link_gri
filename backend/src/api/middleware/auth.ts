import { Broker } from '../../models/Broker';
import { logger } from '../../utils/logger';

// Simple API token authentication
export async function authenticateBroker(request: any, reply: any): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Find broker by API token
    const broker = await Broker.findByApiToken(token);
    
    if (!broker) {
      reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid API token',
        },
      });
      return;
    }
    
    if (!broker.isActive) {
      reply.status(403).send({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Broker account is inactive',
        },
      });
      return;
    }
    
    // Attach broker to request
    request.broker = broker;
    
  } catch (error) {
    logger.error('Authentication error:', error);
    reply.status(500).send({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}

// Optional authentication (for public endpoints)
export async function optionalAuth(request: any, reply: any): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const broker = await Broker.findByApiToken(token);
      
      if (broker && broker.isActive) {
        request.broker = broker;
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
}
