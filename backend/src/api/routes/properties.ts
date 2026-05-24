import { Property } from '../../models/Property';
import { Broker } from '../../models/Broker';
import { authenticateBroker } from '../middleware/auth';
import { logger } from '../../utils/logger';

export async function propertyRoutes(fastify: any, options: any): Promise<void> {
  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticateBroker);

  // List properties with filters
  fastify.get('/properties', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const {
        page = 1,
        limit = 20,
        type,
        status,
        minPrice,
        maxPrice,
        bedrooms,
        city,
        neighborhood,
        features,
        targetProfile,
        search,
        sortBy = 'createdAt',
        order = 'desc',
      } = request.query;

      const query: any = { brokerId: broker._id };

      if (type) query.type = type;
      if (status) query.status = status;
      if (minPrice !== undefined) query.price = { ...query.price, $gte: Number(minPrice) };
      if (maxPrice !== undefined) query.price = { ...query.price, $lte: Number(maxPrice) };
      if (bedrooms !== undefined) query.bedrooms = { $gte: Number(bedrooms) };
      if (city) query['address.city'] = new RegExp(city, 'i');
      if (neighborhood) query['address.neighborhood'] = new RegExp(neighborhood, 'i');
      if (features) {
        const featureList = Array.isArray(features) ? features : features.split(',');
        query.features = { $all: featureList };
      }
      if (targetProfile) {
        const profileList = Array.isArray(targetProfile) ? targetProfile : targetProfile.split(',');
        query.targetProfile = { $in: profileList };
      }
      if (search) {
        query.$text = { $search: search };
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortQuery: any = search ? { score: { $meta: 'textScore' } } : { [sortBy]: sortOrder };

      const [properties, total] = await Promise.all([
        Property.find(query)
          .sort(sortQuery)
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
        error: { code: 'PROPERTIES_ERROR', message: 'Failed to get properties' },
      });
    }
  });

  // Get single property
  fastify.get('/properties/:id', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { id } = request.params;

      const property = await Property.findOne({
        _id: id,
        brokerId: broker._id,
      }).lean();

      if (!property) {
        reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Property not found' },
        });
        return;
      }

      reply.send({ success: true, data: property });
    } catch (error) {
      logger.error('Error getting property:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'PROPERTY_ERROR', message: 'Failed to get property' },
      });
    }
  });

  // Create property
  fastify.post('/properties', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const propertyData = request.body;

      const property = new Property({
        ...propertyData,
        brokerId: broker._id,
      });

      await property.save();

      reply.status(201).send({
        success: true,
        data: property,
      });
    } catch (error: any) {
      logger.error('Error creating property:', error);
      reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Failed to create property',
        },
      });
    }
  });

  // Update property
  fastify.put('/properties/:id', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { id } = request.params;
      const updateData = request.body;

      const property = await Property.findOneAndUpdate(
        { _id: id, brokerId: broker._id },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!property) {
        reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Property not found' },
        });
        return;
      }

      reply.send({ success: true, data: property });
    } catch (error: any) {
      logger.error('Error updating property:', error);
      reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Failed to update property',
        },
      });
    }
  });

  // Delete property (soft delete)
  fastify.delete('/properties/:id', async (request: any, reply: any) => {
    try {
      const broker = request.broker;
      const { id } = request.params;

      const property = await Property.findOneAndUpdate(
        { _id: id, brokerId: broker._id },
        { $set: { active: false } },
        { new: true }
      );

      if (!property) {
        reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Property not found' },
        });
        return;
      }

      reply.send({ success: true, message: 'Property deleted successfully' });
    } catch (error) {
      logger.error('Error deleting property:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'DELETE_ERROR', message: 'Failed to delete property' },
      });
    }
  });

  // Get property types and features (for filters)
  fastify.get('/properties/filters/options', async (request: any, reply: any) => {
    try {
      const broker = request.broker;

      const [types, features, cities, neighborhoods] = await Promise.all([
        Property.distinct('type', { brokerId: broker._id, active: true }),
        Property.distinct('features', { brokerId: broker._id, active: true }),
        Property.distinct('address.city', { brokerId: broker._id, active: true }),
        Property.distinct('address.neighborhood', { brokerId: broker._id, active: true }),
      ]);

      reply.send({
        success: true,
        data: {
          types,
          features,
          cities,
          neighborhoods,
          priceRanges: [
            { label: 'Até R$ 300k', min: 0, max: 300000 },
            { label: 'R$ 300k - 500k', min: 300000, max: 500000 },
            { label: 'R$ 500k - 1M', min: 500000, max: 1000000 },
            { label: 'R$ 1M - 2M', min: 1000000, max: 2000000 },
            { label: 'Acima de R$ 2M', min: 2000000, max: null },
          ],
        },
      });
    } catch (error) {
      logger.error('Error getting filter options:', error);
      reply.status(500).send({
        success: false,
        error: { code: 'FILTERS_ERROR', message: 'Failed to get filter options' },
      });
    }
  });
}
