import Redis from 'ioredis';
import { logger } from '../utils/logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

// Helper functions for state management
export async function getLeadState(leadId: string): Promise<any | null> {
  const data = await redis.get(`lead:state:${leadId}`);
  return data ? JSON.parse(data) : null;
}

export async function setLeadState(leadId: string, state: any, ttl: number = 3600): Promise<void> {
  await redis.setex(`lead:state:${leadId}`, ttl, JSON.stringify(state));
}

export async function deleteLeadState(leadId: string): Promise<void> {
  await redis.del(`lead:state:${leadId}`);
}

// Cache for broker data
export async function getBrokerCache(brokerId: string): Promise<any | null> {
  const data = await redis.get(`broker:${brokerId}`);
  return data ? JSON.parse(data) : null;
}

export async function setBrokerCache(brokerId: string, data: any, ttl: number = 300): Promise<void> {
  await redis.setex(`broker:${brokerId}`, ttl, JSON.stringify(data));
}

// Rate limiting for Telegram webhook
export async function checkRateLimit(key: string, limit: number, window: number): Promise<boolean> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, window);
  }
  return current <= limit;
}

export async function closeRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis connection closed');
}
