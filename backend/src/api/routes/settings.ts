import { Broker } from '../../models/Broker';
import { authenticateBroker } from '../middleware/auth';
import { logger } from '../../utils/logger';

export async function settingsRoutes(fastify: any, options: any): Promise<void> {
  fastify.addHook('preHandler', authenticateBroker);

  // Get broker settings
  fastify.get('/settings', async (request: any, reply: any) => {
    try {
      const broker = request.broker;

      reply.send({
        success: true,
        data: {
          profile: {
            name: broker.name,
            email: broker.email,
            phone: broker.phone,
          },
          plan: broker.plan,
          settings: broker.settings,
          deepLink: broker.deepLink,
        },
      });
    } catch (error) {
      logger.error('Error getting settings:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'SETTINGS_ERROR', message: 'Failed to get settings' },
      });
    }
  });

  // Update broker settings
  fastify.put('/settings', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { name, phone, settings } = request.body;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (settings) updateData.settings = { ...broker.settings, ...settings };

      const updatedBroker = await Broker.findByIdAndUpdate(
        broker._id,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      reply.send({
        success: true,
        data: {
          profile: {
            name: updatedBroker!.name,
            email: updatedBroker!.email,
            phone: updatedBroker!.phone,
          },
          plan: updatedBroker!.plan,
          settings: updatedBroker!.settings,
        },
      });
    } catch (error: any) {
      logger.error('Error updating settings:', error);
      reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message || 'Failed to update settings' },
      });
    }
  });

  // Update notification settings
  fastify.put('/settings/notifications', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { notificationEmail, notificationPush, autoQualification } = request.body;

      const updatedBroker = await Broker.findByIdAndUpdate(
        broker._id,
        {
          $set: {
            'settings.notificationEmail': notificationEmail ?? broker.settings.notificationEmail,
            'settings.notificationPush': notificationPush ?? broker.settings.notificationPush,
            'settings.autoQualification': autoQualification ?? broker.settings.autoQualification,
          },
        },
        { new: true }
      );

      reply.send({
        success: true,
        data: updatedBroker!.settings,
      });
    } catch (error: any) {
      logger.error('Error updating notification settings:', error);
      reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message || 'Failed to update notifications' },
      });
    }
  });

  // Update working hours
  fastify.put('/settings/working-hours', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { start, end, timezone } = request.body;

      const updatedBroker = await Broker.findByIdAndUpdate(
        broker._id,
        {
          $set: {
            'settings.workingHours.start': start ?? broker.settings.workingHours.start,
            'settings.workingHours.end': end ?? broker.settings.workingHours.end,
            'settings.workingHours.timezone': timezone ?? broker.settings.workingHours.timezone,
          },
        },
        { new: true }
      );

      reply.send({
        success: true,
        data: updatedBroker!.settings.workingHours,
      });
    } catch (error: any) {
      logger.error('Error updating working hours:', error);
      reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message || 'Failed to update working hours' },
      });
    }
  });

  // Regenerate deep link token
  fastify.post('/settings/regenerate-link', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { v4: uuidv4 } = await import('uuid');

      const newToken = uuidv4().replace(/-/g, '').substring(0, 16);

      const updatedBroker = await Broker.findByIdAndUpdate(
        broker._id,
        { $set: { deepLinkToken: newToken } },
        { new: true }
      );

      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'clavisapp_bot';

      reply.send({
        success: true,
        data: {
          deepLinkToken: updatedBroker!.deepLinkToken,
          deepLink: `https://t.me/${botUsername}?start=${updatedBroker!.deepLinkToken}`,
        },
      });
    } catch (error) {
      logger.error('Error regenerating link:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'REGENERATE_ERROR', message: 'Failed to regenerate link' },
      });
    }
  });
}
