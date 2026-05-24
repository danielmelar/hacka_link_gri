import mongoose, { Schema, Document, Types } from 'mongoose';
import { Lead } from '../../models/Lead';
import { authenticateBroker } from '../middleware/auth';
import { logger } from '../../utils/logger';

// FollowUp Model (inline for simplicity)
export interface IFollowUp extends Document {
  _id: Types.ObjectId;
  leadId: Types.ObjectId;
  brokerId: Types.ObjectId;
  type: 'ligacao' | 'visita' | 'email' | 'whatsapp' | 'reuniao' | 'outro';
  status: 'pendente' | 'concluido' | 'cancelado';
  scheduledAt: Date;
  completedAt?: Date;
  notes?: string;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    brokerId: { type: Schema.Types.ObjectId, ref: 'Broker', required: true, index: true },
    type: {
      type: String,
      enum: ['ligacao', 'visita', 'email', 'whatsapp', 'reuniao', 'outro'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pendente', 'concluido', 'cancelado'],
      default: 'pendente',
    },
    scheduledAt: { type: Date, required: true },
    completedAt: Date,
    notes: String,
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FollowUpSchema.index({ brokerId: 1, status: 1, scheduledAt: 1 });
FollowUpSchema.index({ leadId: 1, scheduledAt: -1 });

export const FollowUp = mongoose.model<IFollowUp>('FollowUp', FollowUpSchema);

export async function followUpRoutes(fastify: any, options: any): Promise<void> {
  fastify.addHook('preHandler', authenticateBroker);

  // List follow-ups for a lead
  fastify.get('/leads/:id/follow-ups', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { id } = request.params;

      // Verify lead belongs to broker
      const lead = await Lead.findOne({ _id: id, brokerId: broker._id });
      if (!lead) {
        reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lead not found' },
        });
        return;
      }

      const followUps = await FollowUp.find({ leadId: id, brokerId: broker._id })
        .sort({ scheduledAt: -1 })
        .lean();

      reply.send({ success: true, data: followUps });
    } catch (error) {
      logger.error('Error getting follow-ups:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'FOLLOWUPS_ERROR', message: 'Failed to get follow-ups' },
      });
    }
  });

  // Create follow-up
  fastify.post('/leads/:id/follow-ups', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { id } = request.params;
      const { type, scheduledAt, notes } = request.body;

      const lead = await Lead.findOne({ _id: id, brokerId: broker._id });
      if (!lead) {
        reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lead not found' },
        });
        return;
      }

      const followUp = new FollowUp({
        leadId: id,
        brokerId: broker._id,
        type,
        scheduledAt: new Date(scheduledAt),
        notes,
      });

      await followUp.save();

      reply.status(201).send({ success: true, data: followUp });
    } catch (error: any) {
      logger.error('Error creating follow-up:', error);
      reply.status(400).send({
        success: false,
        error: { code: 'CREATE_ERROR', message: error.message || 'Failed to create follow-up' },
      });
    }
  });

  // Update follow-up
  fastify.put('/follow-ups/:followUpId', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { followUpId } = request.params;
      const updateData = request.body;

      const followUp = await FollowUp.findOneAndUpdate(
        { _id: followUpId, brokerId: broker._id },
        { $set: updateData },
        { new: true }
      );

      if (!followUp) {
        reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Follow-up not found' },
        });
        return;
      }

      reply.send({ success: true, data: followUp });
    } catch (error: any) {
      logger.error('Error updating follow-up:', error);
      reply.status(400).send({
        success: false,
        error: { code: 'UPDATE_ERROR', message: error.message || 'Failed to update follow-up' },
      });
    }
  });

  // Delete follow-up
  fastify.delete('/follow-ups/:followUpId', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { followUpId } = request.params;

      const followUp = await FollowUp.findOneAndDelete({
        _id: followUpId,
        brokerId: broker._id,
      });

      if (!followUp) {
        reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Follow-up not found' },
        });
        return;
      }

      reply.send({ success: true, message: 'Follow-up deleted' });
    } catch (error) {
      logger.error('Error deleting follow-up:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'DELETE_ERROR', message: 'Failed to delete follow-up' },
      });
    }
  });

  // Get calendar (all follow-ups for broker)
  fastify.get('/calendar', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { startDate, endDate, status } = request.query;

      const query: any = { brokerId: broker._id };

      if (startDate || endDate) {
        query.scheduledAt = {};
        if (startDate) query.scheduledAt.$gte = new Date(startDate);
        if (endDate) query.scheduledAt.$lte = new Date(endDate);
      }

      if (status) query.status = status;

      const followUps = await FollowUp.find(query)
        .populate('leadId', 'name phone')
        .sort({ scheduledAt: 1 })
        .lean();

      reply.send({ success: true, data: followUps });
    } catch (error) {
      logger.error('Error getting calendar:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'CALENDAR_ERROR', message: 'Failed to get calendar' },
      });
    }
  });

  // Schedule appointment for lead
  fastify.post('/leads/:id/schedule', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { id } = request.params;
      const { date, location, notes } = request.body;

      const lead = await Lead.findOne({ _id: id, brokerId: broker._id });
      if (!lead) {
        reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lead not found' },
        });
        return;
      }

      lead.scheduledAppointment = {
        date: new Date(date),
        location,
        notes,
      };
      lead.state.etapa = 'agendamento';
      await lead.save();

      // Also create a follow-up
      const followUp = new FollowUp({
        leadId: id,
        brokerId: broker._id,
        type: 'visita',
        scheduledAt: new Date(date),
        notes: location ? `Local: ${location}. ${notes || ''}` : notes,
      });
      await followUp.save();

      reply.send({ success: true, data: { lead, followUp } });
    } catch (error: any) {
      logger.error('Error scheduling appointment:', error);
      reply.status(400).send({
        success: false,
        error: { code: 'SCHEDULE_ERROR', message: error.message || 'Failed to schedule appointment' },
      });
    }
  });
}
