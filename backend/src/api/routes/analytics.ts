import { Lead } from '../../models/Lead';
import { Message } from '../../models/Message';
import { Property } from '../../models/Property';
import { authenticateBroker } from '../middleware/auth';
import { logger } from '../../utils/logger';

export async function analyticsRoutes(fastify: any, options: any): Promise<void> {
  fastify.addHook('preHandler', authenticateBroker);

  // Overview metrics
  fastify.get('/analytics/overview', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const brokerId = broker._id.toString();

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalLeads,
        newLeads30d,
        newLeads7d,
        qualifiedLeads,
        readyLeads,
        claimedLeads,
        totalProperties,
        activeProperties,
      ] = await Promise.all([
        Lead.countDocuments({ brokerId, isActive: true }),
        Lead.countDocuments({ brokerId, isActive: true, createdAt: { $gte: thirtyDaysAgo } }),
        Lead.countDocuments({ brokerId, isActive: true, createdAt: { $gte: sevenDaysAgo } }),
        Lead.countDocuments({ brokerId, isActive: true, score: { $gte: 60 } }),
        Lead.countDocuments({ brokerId, isActive: true, 'state.prontoParaCorretor': true, claimedByBroker: false }),
        Lead.countDocuments({ brokerId, isActive: true, claimedByBroker: true }),
        Property.countDocuments({ brokerId }),
        Property.countDocuments({ brokerId, active: true }),
      ]);

      // Leads by day (last 30 days)
      const leadsByDay = await Lead.aggregate([
        { $match: { brokerId, createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Fill missing days with 0
      const daysMap = new Map();
      for (let i = 0; i < 30; i++) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split('T')[0];
        daysMap.set(key, 0);
      }
      leadsByDay.forEach((item: any) => daysMap.set(item._id, item.count));
      const leadsTimeline = Array.from(daysMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      reply.send({
        success: true,
        data: {
          leads: {
            total: totalLeads,
            newThisMonth: newLeads30d,
            newThisWeek: newLeads7d,
            qualified: qualifiedLeads,
            readyForContact: readyLeads,
            claimed: claimedLeads,
            conversionRate: totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0,
          },
          properties: {
            total: totalProperties,
            active: activeProperties,
          },
          timeline: leadsTimeline,
        },
      });
    } catch (error) {
      logger.error('Error getting analytics overview:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'ANALYTICS_ERROR', message: 'Failed to get analytics' },
      });
    }
  });

  // Leads funnel by stage
  fastify.get('/analytics/funnel', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const brokerId = broker._id.toString();

      const funnel = await Lead.aggregate([
        { $match: { brokerId, isActive: true } },
        {
          $group: {
            _id: '$state.etapa',
            count: { $sum: 1 },
            avgScore: { $avg: '$score' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const stageOrder = ['inicio', 'qualificacao', 'apresentacao', 'agendamento', 'fechamento'];
      const funnelData = stageOrder.map((stage) => {
        const item = funnel.find((f: any) => f._id === stage);
        return {
          stage,
          label: getStageLabel(stage),
          count: item?.count || 0,
          avgScore: Math.round(item?.avgScore || 0),
        };
      });

      reply.send({ success: true, data: funnelData });
    } catch (error) {
      logger.error('Error getting funnel:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'FUNNEL_ERROR', message: 'Failed to get funnel data' },
      });
    }
  });

  // Agent performance
  fastify.get('/analytics/agents', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const brokerId = broker._id.toString();

      const agentStats = await Lead.aggregate([
        { $match: { brokerId, isActive: true } },
        {
          $group: {
            _id: '$state.agenteAtual',
            totalLeads: { $sum: 1 },
            avgScore: { $avg: '$score' },
            qualifiedCount: {
              $sum: { $cond: [{ $gte: ['$score', 60] }, 1, 0] },
            },
            readyCount: {
              $sum: { $cond: [{ $eq: ['$state.prontoParaCorretor', true] }, 1, 0] },
            },
          },
        },
      ]);

      const agentData = agentStats.map((stat: any) => ({
        agent: stat._id,
        label: getAgentLabel(stat._id),
        totalLeads: stat.totalLeads,
        avgScore: Math.round(stat.avgScore || 0),
        qualifiedCount: stat.qualifiedCount,
        readyCount: stat.readyCount,
        qualificationRate: stat.totalLeads > 0 ? Math.round((stat.qualifiedCount / stat.totalLeads) * 100) : 0,
      }));

      reply.send({ success: true, data: agentData });
    } catch (error) {
      logger.error('Error getting agent analytics:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'AGENT_ANALYTICS_ERROR', message: 'Failed to get agent analytics' },
      });
    }
  });

  // Message stats
  fastify.get('/analytics/messages', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const brokerId = broker._id.toString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const messageStats = await Message.getStatsByBroker(brokerId, thirtyDaysAgo);

      const inbound = messageStats.find((s: any) => s._id === 'inbound')?.count || 0;
      const outbound = messageStats.find((s: any) => s._id === 'outbound')?.count || 0;

      reply.send({
        success: true,
        data: {
          total: inbound + outbound,
          inbound,
          outbound,
          responseRate: inbound > 0 ? Math.round((outbound / inbound) * 100) : 0,
        },
      });
    } catch (error) {
      logger.error('Error getting message analytics:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'MESSAGE_ANALYTICS_ERROR', message: 'Failed to get message analytics' },
      });
    }
  });
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    inicio: 'Início',
    qualificacao: 'Qualificação',
    apresentacao: 'Apresentação',
    agendamento: 'Agendamento',
    fechamento: 'Fechamento',
  };
  return labels[stage] || stage;
}

function getAgentLabel(agent: string): string {
  const labels: Record<string, string> = {
    SDR_Geral: 'Sofia (SDR)',
    Especialista_Familia: 'Especialista Família',
    Especialista_Alto_Padrao: 'Especialista Alto Padrão',
  };
  return labels[agent] || agent;
}
