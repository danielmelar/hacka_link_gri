import mongoose, { Schema, Document, Types } from 'mongoose';
import type { TipoImovel } from '../types';

export interface IProperty extends Document {
  _id: Types.ObjectId;
  brokerId: Types.ObjectId;
  
  // Informações básicas
  title: string;
  description: string;
  price: number;
  priceType: 'venda' | 'aluguel' | 'temporada';
  
  // Tipo e características
  type: TipoImovel;
  status: 'disponivel' | 'reservado' | 'vendido' | 'indisponivel';
  
  // Detalhes
  bedrooms: number;
  bathrooms: number;
  suites: number;
  parkingSpots: number;
  area: number; // em m²
  areaUtil?: number;
  areaTotal?: number;
  
  // Localização
  address: {
    street: string;
    number?: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  };
  
  // Características e diferenciais
  features: string[]; // ['piscina', 'academia', 'playground', 'seguranca_24h']
  targetProfile: string[]; // ['familia', 'alto_padrao', 'investidor', 'jovens']
  
  // Mídia
  images: Array<{
    url: string;
    caption?: string;
    isMain?: boolean;
  }>;
  videos?: string[];
  virtualTourUrl?: string;
  
  // Documentos
  documents?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  
  // Configurações
  active: boolean;
  featured: boolean;
  
  // Metadados para IA
  aiMetadata?: {
    embedding?: number[];
    keywords: string[];
    sentiment: string;
    lastAnalyzedAt?: Date;
  };
  
  // Estatísticas
  stats: {
    views: number;
    inquiries: number;
    shares: number;
    lastViewedAt?: Date;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>(
  {
    brokerId: {
      type: Schema.Types.ObjectId,
      ref: 'Broker',
      required: [true, 'Broker ID é obrigatório'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Título é obrigatório'],
      trim: true,
      maxlength: [200, 'Título não pode ter mais de 200 caracteres'],
    },
    description: {
      type: String,
      required: [true, 'Descrição é obrigatória'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Preço é obrigatório'],
      min: [0, 'Preço não pode ser negativo'],
    },
    priceType: {
      type: String,
      enum: ['venda', 'aluguel', 'temporada'],
      default: 'venda',
    },
    type: {
      type: String,
      enum: ['apartamento', 'casa', 'terreno', 'comercial', 'cobertura', 'flat'],
      required: [true, 'Tipo do imóvel é obrigatório'],
    },
    status: {
      type: String,
      enum: ['disponivel', 'reservado', 'vendido', 'indisponivel'],
      default: 'disponivel',
    },
    bedrooms: {
      type: Number,
      default: 0,
      min: 0,
    },
    bathrooms: {
      type: Number,
      default: 0,
      min: 0,
    },
    suites: {
      type: Number,
      default: 0,
      min: 0,
    },
    parkingSpots: {
      type: Number,
      default: 0,
      min: 0,
    },
    area: {
      type: Number,
      required: [true, 'Área é obrigatória'],
      min: [0, 'Área não pode ser negativa'],
    },
    areaUtil: Number,
    areaTotal: Number,
    address: {
      street: { type: String, required: true },
      number: String,
      complement: String,
      neighborhood: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: String,
      latitude: Number,
      longitude: Number,
    },
    features: [{
      type: String,
      trim: true,
    }],
    targetProfile: [{
      type: String,
      enum: ['familia', 'alto_padrao', 'investidor', 'jovens', 'idosos', 'primeiro_imovel'],
    }],
    images: [{
      url: { type: String, required: true },
      caption: String,
      isMain: { type: Boolean, default: false },
    }],
    videos: [String],
    virtualTourUrl: String,
    documents: [{
      name: String,
      url: String,
      type: String,
    }],
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    aiMetadata: {
      embedding: [Number],
      keywords: [String],
      sentiment: String,
      lastAnalyzedAt: Date,
    },
    stats: {
      views: { type: Number, default: 0 },
      inquiries: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      lastViewedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for multi-tenant queries and search
PropertySchema.index({ brokerId: 1, active: 1 });
PropertySchema.index({ brokerId: 1, type: 1, active: 1 });
PropertySchema.index({ brokerId: 1, price: 1, active: 1 });
PropertySchema.index({ brokerId: 1, 'address.city': 1, active: 1 });
PropertySchema.index({ brokerId: 1, 'address.neighborhood': 1, active: 1 });
PropertySchema.index({ brokerId: 1, bedrooms: 1, active: 1 });
PropertySchema.index({ brokerId: 1, targetProfile: 1, active: 1 });
PropertySchema.index({ brokerId: 1, features: 1, active: 1 });

// Text index for search
PropertySchema.index({ 
  title: 'text', 
  description: 'text',
  'address.neighborhood': 'text',
  'address.city': 'text',
}, {
  weights: {
    title: 10,
    'address.neighborhood': 5,
    description: 3,
    'address.city': 2,
  },
  name: 'property_text_search',
});

// Virtual for formatted price
PropertySchema.virtual('priceFormatted').get(function(this: IProperty) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(this.price);
});

// Virtual for price per m²
PropertySchema.virtual('pricePerSqm').get(function(this: IProperty) {
  if (!this.area || this.area === 0) return null;
  return this.price / this.area;
});

// Methods
PropertySchema.methods.incrementViews = function(this: IProperty): void {
  this.stats.views += 1;
  this.stats.lastViewedAt = new Date();
};

PropertySchema.methods.incrementInquiries = function(this: IProperty): void {
  this.stats.inquiries += 1;
};

// Statics
PropertySchema.statics.findByBroker = function(brokerId: string, options: any = {}) {
  const query = this.find({ brokerId, active: true });
  
  if (options.type) {
    query.where('type').equals(options.type);
  }
  
  if (options.minPrice) {
    query.where('price').gte(options.minPrice);
  }
  
  if (options.maxPrice) {
    query.where('price').lte(options.maxPrice);
  }
  
  if (options.bedrooms) {
    query.where('bedrooms').gte(options.bedrooms);
  }
  
  if (options.city) {
    query.where('address.city').equals(new RegExp(options.city, 'i'));
  }
  
  if (options.neighborhood) {
    query.where('address.neighborhood').equals(new RegExp(options.neighborhood, 'i'));
  }
  
  if (options.features && options.features.length > 0) {
    query.where('features').all(options.features);
  }
  
  if (options.targetProfile && options.targetProfile.length > 0) {
    query.where('targetProfile').in(options.targetProfile);
  }
  
  if (options.sortBy) {
    query.sort(options.sortBy);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query;
};

PropertySchema.statics.search = function(brokerId: string, searchTerm: string) {
  return this.find({
    brokerId,
    active: true,
    $text: { $search: searchTerm },
  }, {
    score: { $meta: 'textScore' },
  }).sort({ score: { $meta: 'textScore' } });
};

export const Property = mongoose.model<IProperty>('Property', PropertySchema);
