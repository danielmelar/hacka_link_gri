import { Lead } from '../../models/Lead';
import { Message } from '../../models/Message';
import { Property } from '../../models/Property';
import { Broker } from '../../models/Broker';
import { authenticateBroker } from '../middleware/auth';
import { getConnectionStats } from '../../services/notification/sseManager';
import { logger } from '../../utils/logger';

export async function dashboardRoutes(fastify: any, options: any): Promise<void> {
  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticateBroker);
  
  // Get broker profile
  fastify.get('/profile', async (request: any, reply: any) => {
    const broker = request.broker;
    
    reply.send({
      success: true,
      data: broker.getPublicProfile(),
    });
  });
  
  // Get broker stats
  fastify.get('/stats', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const brokerId = broker._id.toString();
      
      // Get lead counts
      const totalLeads = await Lead.countDocuments({ brokerId, isActive: true });
      const activeLeads = await Lead.countDocuments({
        brokerId,
        isActive: true,
        lastInteractionAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      });
      const qualifiedLeads = await Lead.countDocuments({
        brokerId,
        isActive: true,
        score: { $gte: 60 },
      });
      const readyForContact = await Lead.countDocuments({
        brokerId,
        isActive: true,
        'state.prontoParaCorretor': true,
        claimedByBroker: false,
      });
      
      // Get message stats
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const messageStats = await Message.getStatsByBroker(brokerId, since);
      
      const inboundMessages = messageStats.find((s: any) => s._id === 'inbound')?.count || 0;
      const outboundMessages = messageStats.find((s: any) => s._id === 'outbound')?.count || 0;
      
      reply.send({
        success: true,
        data: {
          leads: {
            total: totalLeads,
            active: activeLeads,
            qualified: qualifiedLeads,
            readyForContact,
          },
          messages: {
            inbound: inboundMessages,
            outbound: outboundMessages,
            total: inboundMessages + outboundMessages,
          },
          properties: await Property.countDocuments({ brokerId, active: true }),
        },
      });
    } catch (error) {
      logger.error('Error getting stats:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to get stats',
        },
      });
    }
  });
  
  // Get leads list
  fastify.get('/leads', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const {
        page = 1,
        limit = 20,
        etapa,
        prontoParaCorretor,
        sortBy = 'lastInteractionAt',
        order = 'desc',
      } = request.query;
      
      const query: any = { brokerId: broker._id, isActive: true };
      
      if (etapa) {
        query['state.etapa'] = etapa;
      }
      
      if (prontoParaCorretor !== undefined) {
        query['state.prontoParaCorretor'] = prontoParaCorretor === 'true';
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOrder = order === 'asc' ? 1 : -1;
      
      const [leads, total] = await Promise.all([
        Lead.find(query)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Lead.countDocuments(query),
      ]);
      
      reply.send({
        success: true,
        data: leads,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          hasMore: skip + leads.length < total,
        },
      });
    } catch (error) {
      logger.error('Error getting leads:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'LEADS_ERROR',
          message: 'Failed to get leads',
        },
      });
    }
  });
  
  // Get single lead
  fastify.get('/leads/:id', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { id } = request.params;
      
      const lead = await Lead.findOne({
        _id: id,
        brokerId: broker._id,
        isActive: true,
      }).lean();
      
      if (!lead) {
        reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Lead not found',
          },
        });
        return;
      }
      
      reply.send({
        success: true,
        data: lead,
      });
    } catch (error) {
      logger.error('Error getting lead:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'LEAD_ERROR',
          message: 'Failed to get lead',
        },
      });
    }
  });
  
  // Get lead messages
  fastify.get('/leads/:id/messages', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { id } = request.params;
      const { limit = 50 } = request.query;
      
      // Verify lead belongs to broker
      const lead = await Lead.findOne({
        _id: id,
        brokerId: broker._id,
      });
      
      if (!lead) {
        reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Lead not found',
          },
        });
        return;
      }
      
      const messages = await Message.findConversation(id, parseInt(limit));
      
      reply.send({
        success: true,
        data: messages,
      });
    } catch (error) {
      logger.error('Error getting messages:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'MESSAGES_ERROR',
          message: 'Failed to get messages',
        },
      });
    }
  });
  
  // Claim lead (mark as being handled by broker)
  fastify.post('/leads/:id/claim', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { id } = request.params;
      
      const lead = await Lead.findOne({
        _id: id,
        brokerId: broker._id,
        isActive: true,
      });
      
      if (!lead) {
        reply.status(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Lead not found',
          },
        });
        return;
      }
      
      lead.claimedByBroker = true;
      lead.claimedAt = new Date();
      await lead.save();
      
      reply.send({
        success: true,
        data: { claimed: true },
      });
    } catch (error) {
      logger.error('Error claiming lead:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'CLAIM_ERROR',
          message: 'Failed to claim lead',
        },
      });
    }
  });
  
  // Get properties
  fastify.get('/properties', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const {
        page = 1,
        limit = 20,
        type,
        minPrice,
        maxPrice,
        bedrooms,
        city,
        featured,
      } = request.query;
      
      const query: any = { brokerId: broker._id, active: true };
      
      if (type) query.type = type;
      if (minPrice) query.price = { $gte: parseInt(minPrice) };
      if (maxPrice) query.price = { ...query.price, $lte: parseInt(maxPrice) };
      if (bedrooms) query.bedrooms = { $gte: parseInt(bedrooms) };
      if (city) query['address.city'] = new RegExp(city, 'i');
      if (featured !== undefined) query.featured = featured === 'true';
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [properties, total] = await Promise.all([
        Property.find(query)
          .sort({ featured: -1, createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Property.countDocuments(query),
      ]);
      
      reply.send({
        success: true,
        data: properties,
        meta: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          hasMore: skip + properties.length < total,
        },
      });
    } catch (error) {
      logger.error('Error getting properties:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'PROPERTIES_ERROR',
          message: 'Failed to get properties',
        },
      });
    }
  });
  
  // Create property
  fastify.post('/properties', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const propertyData = request.body;
      
      const property = await Property.create({
        ...propertyData,
        brokerId: broker._id,
      });
      
      reply.status(201).send({
        success: true,
        data: property,
      });
    } catch (error) {
      logger.error('Error creating property:', error);
      reply.status(500).send({
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create property',
        },
      });
    }
  });
  
  // Get deep link
  fastify.get('/deep-link', async (request: any, reply: any) => {
    const broker = request.broker;
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'clavisapp_bot';
    const deepLink = `https://t.me/${botUsername}?start=${broker.deepLinkToken}`;
    
    reply.send({
      success: true,
      data: {
        deepLink,
        token: broker.deepLinkToken,
      },
    });
  });
  
  // Get SSE connection stats (admin only)
  fastify.get('/sse-stats', async (request: any, reply: any) => {
    const stats = getConnectionStats();
    
    reply.send({
      success: true,
      data: stats,
    });
  });
}
