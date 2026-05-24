import { Broker } from '../../models/Broker';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export async function authRoutes(fastify: any, options: any): Promise<void> {
  // Login
  fastify.post('/auth/login', async (request: any, reply: any) => {
    try {
      const { email, password } = request.body;

      if (!email || !password) {
        reply.status(400).send({
          success: false,
          error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required' },
        });
        return;
      }

      // Find broker by email with password
      const broker = await Broker.findOne({ email: email.toLowerCase() }).select('+password');

      if (!broker) {
        reply.status(401).send({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        });
        return;
      }

      if (!broker.isActive) {
        reply.status(403).send({
          success: false,
          error: { code: 'ACCOUNT_INACTIVE', message: 'Account is inactive' },
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, broker.password);
      if (!isValidPassword) {
        reply.status(401).send({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        });
        return;
      }

      // Generate JWT
      const token = jwt.sign(
        { brokerId: broker._id.toString(), email: broker.email },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN as any }
      );

      // Update last login
      broker.lastLoginAt = new Date();
      await broker.save();

      reply.send({
        success: true,
        data: {
          token,
          broker: broker.getPublicProfile(),
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'LOGIN_ERROR', message: 'Login failed' },
      });
    }
  });

  // Get current broker profile
  fastify.get('/auth/me', async (request: any, reply: any) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.status(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' },
        });
        return;
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;

      const broker = await Broker.findById(decoded.brokerId);
      if (!broker || !broker.isActive) {
        reply.status(401).send({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
        });
        return;
      }

      reply.send({
        success: true,
        data: broker.getPublicProfile(),
      });
    } catch (error) {
      logger.error('Auth me error:', error);
      reply.status(401).send({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
      });
    }
  });
}
