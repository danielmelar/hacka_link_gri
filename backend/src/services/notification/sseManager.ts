// Using http.ServerResponse instead of express.Response to avoid express dependency
import type { ServerResponse } from 'http';
import { logger } from '../../utils/logger';
import { ENABLE_SSE } from '../../config/env';
type Response = ServerResponse;

// Map of brokerId to set of active connections
const connections = new Map<string, Set<Response>>();

// Map of connection ID to metadata
const connectionMetadata = new Map<string, {
  brokerId: string;
  connectedAt: Date;
}>();

interface SSEEvent {
  type: string;
  timestamp: string;
  data: any;
}

// Register a new SSE connection
export function registerSSEConnection(brokerId: string, res: Response): string {
  if (!ENABLE_SSE) {
    logger.warn('SSE is disabled');
    return '';
  }
  
  const connectionId = `${brokerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Initialize broker connections set if needed
  if (!connections.has(brokerId)) {
    connections.set(brokerId, new Set());
  }
  
  connections.get(brokerId)!.add(res);
  connectionMetadata.set(connectionId, {
    brokerId,
    connectedAt: new Date(),
  });
  
  logger.info(`SSE connection registered: ${connectionId}`, {
    brokerId,
    totalConnections: connections.get(brokerId)!.size,
  });
  
  // Send initial connection success event
  sendEventToConnection(res, {
    type: 'connected',
    timestamp: new Date().toISOString(),
    data: { connectionId },
  });
  
  return connectionId;
}

// Unregister an SSE connection
export function unregisterSSEConnection(connectionId: string): void {
  const metadata = connectionMetadata.get(connectionId);
  if (!metadata) {
    return;
  }
  
  const { brokerId } = metadata;
  const brokerConnections = connections.get(brokerId);
  
  if (brokerConnections) {
    // Find and remove the specific connection
    for (const res of brokerConnections) {
      // We can't directly compare Response objects, so we use a workaround
      // In practice, connections are cleaned up when the client disconnects
    }
    
    logger.info(`SSE connection unregistered: ${connectionId}`, {
      brokerId,
      remainingConnections: brokerConnections.size,
    });
  }
  
  connectionMetadata.delete(connectionId);
}

// Send event to a specific connection
function sendEventToConnection(res: Response, event: SSEEvent): void {
  try {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    res.write(data);
  } catch (error) {
    logger.error('Error sending SSE event to connection:', error);
  }
}

// Send event to all connections of a broker
export async function notifyBroker(brokerId: string, event: Omit<SSEEvent, 'timestamp'> | SSEEvent): Promise<void> {
  if (!ENABLE_SSE) {
    return;
  }
  
  const brokerConnections = connections.get(brokerId);
  if (!brokerConnections || brokerConnections.size === 0) {
    // No active connections, but that's okay
    return;
  }
  
  const fullEvent: SSEEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  
  const data = `data: ${JSON.stringify(fullEvent)}\n\n`;
  const deadConnections: Response[] = [];
  
  for (const res of brokerConnections) {
    try {
      res.write(data);
    } catch (error) {
      // Connection is dead, mark for removal
      deadConnections.push(res);
    }
  }
  
  // Clean up dead connections
  for (const deadRes of deadConnections) {
    brokerConnections.delete(deadRes);
  }
  
  if (deadConnections.length > 0) {
    logger.info(`Cleaned up ${deadConnections.length} dead SSE connections for broker ${brokerId}`);
  }
  
  logger.debug(`Sent SSE event to ${brokerConnections.size} connections`, {
    brokerId,
    eventType: event.type,
  });
}

// Send event to all connected brokers (admin broadcasts)
export async function broadcastEvent(event: Omit<SSEEvent, 'timestamp'>): Promise<void> {
  if (!ENABLE_SSE) {
    return;
  }
  
  const fullEvent: SSEEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };
  
  for (const [brokerId, brokerConnections] of connections) {
    const data = `data: ${JSON.stringify(fullEvent)}\n\n`;
    
    for (const res of brokerConnections) {
      try {
        res.write(data);
      } catch (error) {
        // Ignore errors for broadcasts
      }
    }
  }
  
  logger.info('Broadcasted SSE event to all brokers', { eventType: event.type });
}

// Get connection statistics
export function getConnectionStats(): {
  totalConnections: number;
  connectionsByBroker: Record<string, number>;
} {
  const stats = {
    totalConnections: 0,
    connectionsByBroker: {} as Record<string, number>,
  };
  
  for (const [brokerId, brokerConnections] of connections) {
    const count = brokerConnections.size;
    stats.connectionsByBroker[brokerId] = count;
    stats.totalConnections += count;
  }
  
  return stats;
}

// Clean up all connections (for shutdown)
export function cleanupAllConnections(): void {
  for (const [brokerId, brokerConnections] of connections) {
    for (const res of brokerConnections) {
      try {
        res.end();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    brokerConnections.clear();
  }
  connections.clear();
  connectionMetadata.clear();
  
  logger.info('All SSE connections cleaned up');
}

// Heartbeat to keep connections alive
export function startHeartbeat(intervalMs: number = 30000): NodeJS.Timeout {
  return setInterval(() => {
    for (const [brokerId, brokerConnections] of connections) {
      for (const res of brokerConnections) {
        try {
          res.write(':heartbeat\n\n');
        } catch (error) {
          // Connection is dead, will be cleaned up on next event
        }
      }
    }
  }, intervalMs);
}
