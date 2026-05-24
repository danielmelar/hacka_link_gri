import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file before validation
dotenv.config();

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  API_URL: z.string().default('http://localhost:3000'),
  
  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/linkgri'),
  
  // Cache
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // OpenRouter (unified API for multiple AI providers)
  OPENROUTER_API_KEY: z.string().min(1, 'OpenRouter API key is required'),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
  OPENROUTER_HTTP_REFERER: z.string().default('https://clavis.immo'),
  OPENROUTER_APP_NAME: z.string().default('CLAVIS'),
  OPENROUTER_MODEL: z.string().default('openai/gpt-4o-mini'),
  OPENROUTER_EMBEDDING_MODEL: z.string().default('openai/text-embedding-3-small'),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'Telegram bot token is required'),
  TELEGRAM_WEBHOOK_URL: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  
  // Features
  ENABLE_SSE: z.string().default('true').transform(v => v === 'true'),
  ENABLE_VECTOR_SEARCH: z.string().default('true').transform(v => v === 'true'),
});

function loadEnv(): z.infer<typeof envSchema> {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      console.error(`❌ Missing or invalid environment variables: ${missingVars}`);
      process.exit(1);
    }
    throw error;
  }
}

export const env = loadEnv();

// Export individual values for convenience
export const {
  NODE_ENV,
  PORT,
  API_URL,
  MONGODB_URI,
  REDIS_URL,
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  OPENROUTER_HTTP_REFERER,
  OPENROUTER_APP_NAME,
  OPENROUTER_MODEL,
  OPENROUTER_EMBEDDING_MODEL,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_WEBHOOK_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  LOG_LEVEL,
  ENABLE_SSE,
  ENABLE_VECTOR_SEARCH,
} = env;
