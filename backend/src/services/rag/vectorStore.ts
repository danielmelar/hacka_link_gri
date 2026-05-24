import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Property } from '../../models/Property';
import { OPENAI_API_KEY, OPENAI_EMBEDDING_MODEL, ENABLE_VECTOR_SEARCH } from '../../config/env';
import { logger } from '../../utils/logger';

let vectorStore: MongoDBAtlasVectorSearch | null = null;

// Initialize vector store
export function initializeVectorStore(): MongoDBAtlasVectorSearch | null {
  if (!ENABLE_VECTOR_SEARCH) {
    logger.info('Vector search is disabled');
    return null;
  }
  
  try {
    const embeddings = new OpenAIEmbeddings({
      modelName: OPENAI_EMBEDDING_MODEL,
      openAIApiKey: OPENAI_API_KEY,
    });
    
    // Note: This requires MongoDB Atlas with Vector Search index configured
    // For local development, we'll use regular text search as fallback
    vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection: Property.collection as any,
      indexName: 'vector_index',
      textKey: 'description',
      embeddingKey: 'aiMetadata.embedding',
    });
    
    logger.info('✅ Vector store initialized');
    return vectorStore;
  } catch (error) {
    logger.error('Failed to initialize vector store:', error);
    return null;
  }
}

// Search properties using vector similarity
export async function vectorSearch(
  brokerId: string,
  query: string,
  filters: any = {},
  limit: number = 5
): Promise<any[]> {
  if (!vectorStore) {
    logger.warn('Vector store not available, falling back to text search');
    return [];
  }
  
  try {
    const results = await vectorStore.similaritySearch(query, limit, {
      preFilter: {
        brokerId: { $eq: brokerId },
        active: { $eq: true },
        ...filters,
      },
    });
    
    return results.map(doc => ({
      ...doc.metadata,
      pageContent: doc.pageContent,
    }));
  } catch (error) {
    logger.error('Error in vector search:', error);
    return [];
  }
}

// Generate embedding for property
export async function generatePropertyEmbedding(property: any): Promise<number[] | null> {
  try {
    const embeddings = new OpenAIEmbeddings({
      modelName: OPENAI_EMBEDDING_MODEL,
      openAIApiKey: OPENAI_API_KEY,
    });
    
    // Create rich text for embedding
    const textForEmbedding = `
      ${property.title}
      ${property.description}
      Tipo: ${property.type}
      ${property.bedrooms} quartos, ${property.bathrooms} banheiros
      Área: ${property.area}m²
      Bairro: ${property.address.neighborhood}
      Cidade: ${property.address.city}
      Características: ${property.features?.join(', ') || ''}
      Perfil: ${property.targetProfile?.join(', ') || ''}
    `.trim();
    
    const embedding = await embeddings.embedQuery(textForEmbedding);
    return embedding;
  } catch (error) {
    logger.error('Error generating property embedding:', error);
    return null;
  }
}

// Update property with embedding
export async function updatePropertyEmbedding(propertyId: string): Promise<boolean> {
  try {
    const property = await Property.findById(propertyId);
    if (!property) {
      logger.error(`Property not found: ${propertyId}`);
      return false;
    }
    
    const embedding = await generatePropertyEmbedding(property);
    if (!embedding) {
      return false;
    }
    
    property.aiMetadata = {
      ...property.aiMetadata,
      embedding,
      lastAnalyzedAt: new Date(),
    };
    
    await property.save();
    logger.info(`Updated embedding for property ${propertyId}`);
    return true;
  } catch (error) {
    logger.error('Error updating property embedding:', error);
    return false;
  }
}

// Batch update embeddings for all properties of a broker
export async function batchUpdateEmbeddings(brokerId: string): Promise<{ updated: number; failed: number }> {
  try {
    const properties = await Property.find({
      brokerId,
      active: true,
      $or: [
        { 'aiMetadata.embedding': { $exists: false } },
        { 'aiMetadata.lastAnalyzedAt': { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Older than 7 days
      ],
    });
    
    let updated = 0;
    let failed = 0;
    
    for (const property of properties) {
      const success = await updatePropertyEmbedding(property._id.toString());
      if (success) {
        updated++;
      } else {
        failed++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    logger.info(`Batch embedding update completed: ${updated} updated, ${failed} failed`);
    return { updated, failed };
  } catch (error) {
    logger.error('Error in batch embedding update:', error);
    return { updated: 0, failed: 0 };
  }
}
