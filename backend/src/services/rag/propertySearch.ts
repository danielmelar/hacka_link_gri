import { Property } from '../../models/Property';
import { vectorSearch } from './vectorStore';
import type { ExtractedEntities, LeadState } from '../../types';
import { logger } from '../../utils/logger';

export interface PropertySearchOptions {
  brokerId: string;
  query?: string;
  entities?: ExtractedEntities;
  leadState?: LeadState;
  limit?: number;
  useVectorSearch?: boolean;
}

export async function searchRelevantProperties(
  brokerId: string,
  entities: ExtractedEntities,
  leadState: LeadState,
  limit: number = 3
): Promise<any[]> {
  try {
    logger.info(`Searching properties for broker ${brokerId}`, { entities, limit });
    
    // Build query based on entities and state
    const query = buildSearchQuery(entities, leadState);
    
    // Build filters
    const filters = buildSearchFilters(entities, leadState);
    
    // Try vector search first if available
    let properties = await vectorSearch(brokerId, query, filters, limit);
    
    // Fallback to regular search if vector search returns no results
    if (properties.length === 0) {
      properties = await regularPropertySearch(brokerId, entities, leadState, limit);
    }
    
    logger.info(`Found ${properties.length} properties`);
    return properties;
  } catch (error) {
    logger.error('Error searching properties:', error);
    return [];
  }
}

function buildSearchQuery(entities: ExtractedEntities, leadState: LeadState): string {
  const parts: string[] = ['imóvel'];
  
  if (entities.tipoImovel || leadState.tipoImovel) {
    parts.push(entities.tipoImovel || leadState.tipoImovel!);
  }
  
  if (entities.regiaoInteresse || leadState.regiaoInteresse) {
    parts.push(entities.regiaoInteresse || leadState.regiaoInteresse!);
  }
  
  if (leadState.perfilEstimado === 'AltoPadrao') {
    parts.push('luxo', 'alto padrão', 'exclusivo');
  }
  
  if (leadState.temFilhos) {
    parts.push('família', 'quartos', 'espaço');
  }
  
  return parts.join(' ');
}

function buildSearchFilters(entities: ExtractedEntities, leadState: LeadState): any {
  const filters: any = {};
  
  // Type filter
  if (entities.tipoImovel || leadState.tipoImovel) {
    filters.type = entities.tipoImovel || leadState.tipoImovel;
  }
  
  // Price filter based on budget
  const budget = parseBudget(entities.orcamento || leadState.orcamentoEstimado);
  if (budget) {
    if (budget.min) filters.price = { $gte: budget.min };
    if (budget.max) {
      filters.price = { ...filters.price, $lte: budget.max };
    }
  }
  
  // Profile filter
  if (leadState.perfilEstimado === 'AltoPadrao') {
    filters.targetProfile = { $in: ['alto_padrao'] };
  }
  
  if (leadState.temFilhos) {
    filters.bedrooms = { $gte: 2 };
    filters.features = { $in: ['playground', 'area_lazer', 'seguranca_24h'] };
  }
  
  return filters;
}

async function regularPropertySearch(
  brokerId: string,
  entities: ExtractedEntities,
  leadState: LeadState,
  limit: number
): Promise<any[]> {
  const query = Property.find({ brokerId, active: true });
  
  // Apply type filter
  if (entities.tipoImovel || leadState.tipoImovel) {
    query.where('type').equals(entities.tipoImovel || leadState.tipoImovel);
  }
  
  // Apply budget filter
  const budget = parseBudget(entities.orcamento || leadState.orcamentoEstimado);
  if (budget) {
    if (budget.min) query.where('price').gte(budget.min);
    if (budget.max) query.where('price').lte(budget.max);
  }
  
  // Apply family filters
  if (leadState.temFilhos) {
    query.where('bedrooms').gte(2);
    query.where('features').in(['playground', 'area_lazer', 'seguranca_24h', 'piscina']);
  }
  
  // Apply high-end filters
  if (leadState.perfilEstimado === 'AltoPadrao') {
    query.where('targetProfile').in(['alto_padrao']);
    query.where('price').gte(1000000);
  }
  
  // Apply region filter
  if (entities.regiaoInteresse || leadState.regiaoInteresse) {
    const region = entities.regiaoInteresse || leadState.regiaoInteresse;
    query.or([
      { 'address.neighborhood': new RegExp(region!, 'i') },
      { 'address.city': new RegExp(region!, 'i') },
    ]);
  }
  
  // Sort by relevance (featured first, then by price)
  query.sort({ featured: -1, price: 1 });
  query.limit(limit);
  
  return query.lean();
}

function parseBudget(budgetString?: string | null): { min?: number; max?: number } | null {
  if (!budgetString) return null;
  
  const normalized = budgetString.toLowerCase().replace(/[\s.]/g, '');
  
  // Try to extract numbers
  const numbers: number[] = [];
  
  // Match patterns like "500mil", "1milhao", "500000", "1.000.000"
  const regex = /(\d+)(?:mil|k|milh[õo]es?|m)?/g;
  let match;
  
  while ((match = regex.exec(normalized)) !== null) {
    let num = parseInt(match[1]);
    
    // Check if followed by "mil" or "milhao"
    const afterMatch = normalized.substring(match.index + match[0].length);
    if (afterMatch.startsWith('mil') || match[0].includes('mil') || match[0].includes('k')) {
      num *= 1000;
    } else if (afterMatch.startsWith('milh') || match[0].includes('milh')) {
      num *= 1000000;
    } else if (num < 1000) {
      // Assume it's in thousands if small number
      num *= 1000;
    }
    
    numbers.push(num);
  }
  
  if (numbers.length === 0) return null;
  
  // Determine min/max based on keywords
  if (normalized.includes('ate') || normalized.includes('até') || normalized.includes('max')) {
    return { max: Math.max(...numbers) };
  }
  
  if (normalized.includes('a partir') || normalized.includes('min') || normalized.includes('desde')) {
    return { min: Math.min(...numbers) };
  }
  
  if (numbers.length >= 2) {
    return {
      min: Math.min(...numbers),
      max: Math.max(...numbers),
    };
  }
  
  return { max: numbers[0] };
}

// Get property by ID (with broker verification)
export async function getPropertyById(propertyId: string, brokerId: string): Promise<any | null> {
  try {
    const property = await Property.findOne({
      _id: propertyId,
      brokerId,
      active: true,
    }).lean();
    
    return property;
  } catch (error) {
    logger.error('Error getting property by ID:', error);
    return null;
  }
}

// Get featured properties for a broker
export async function getFeaturedProperties(brokerId: string, limit: number = 5): Promise<any[]> {
  try {
    return Property.find({
      brokerId,
      active: true,
      featured: true,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  } catch (error) {
    logger.error('Error getting featured properties:', error);
    return [];
  }
}
