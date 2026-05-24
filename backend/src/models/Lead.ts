import mongoose, { Schema, Document, Types } from 'mongoose';
import type { LeadState, PerfilEstimado, AgenteAtual, EtapaLead, TipoImovel } from '../types';

export interface ILead extends Document {
  _id: Types.ObjectId;
  brokerId: Types.ObjectId;
  telegramChatId: string;
  name?: string;
  phone?: string;
  email?: string;
  
  // Estado do agente
  state: LeadState;
  
  // Score e qualificação
  score: number;
  scoreHistory: Array<{
    score: number;
    reason: string;
    timestamp: Date;
  }>;
  
  // Interações
  lastInteractionAt: Date;
  firstInteractionAt: Date;
  totalMessages: number;
  
  // Status
  isActive: boolean;
  claimedByBroker: boolean;
  claimedAt?: Date;
  
  // Tags e anotações
  tags: string[];
  notes?: string;
  
  // Agendamento
  scheduledAppointment?: {
    date: Date;
    location?: string;
    notes?: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  updateScore(newScore: number, reason: string): void;
  calculateProfile(): PerfilEstimado;
  isQualified(): boolean;
}

const LeadStateSchema = new Schema({
  perfilEstimado: {
    type: String,
    enum: ['MCMV', 'MedioPadrao', 'AltoPadrao', 'Indefinido'],
    default: 'Indefinido',
  },
  temFilhos: { type: Boolean, default: null },
  quantosFilhos: { type: Number, default: null },
  dorPrincipal: { type: String, default: null },
  orcamentoEstimado: { type: String, default: null },
  regiaoInteresse: { type: String, default: null },
  tipoImovel: {
    type: String,
    enum: ['apartamento', 'casa', 'terreno', 'comercial', 'cobertura', 'flat', null],
    default: null,
  },
  urgencia: {
    type: String,
    enum: ['baixa', 'media', 'alta', null],
    default: null,
  },
  agenteAtual: {
    type: String,
    enum: ['SDR_Geral', 'Especialista_Familia', 'Especialista_Alto_Padrao'],
    default: 'SDR_Geral',
  },
  prontoParaCorretor: { type: Boolean, default: false },
  etapa: {
    type: String,
    enum: ['inicio', 'qualificacao', 'apresentacao', 'agendamento', 'fechamento'],
    default: 'inicio',
  },
}, { _id: false });

const LeadSchema = new Schema<ILead>(
  {
    brokerId: {
      type: Schema.Types.ObjectId,
      ref: 'Broker',
      required: [true, 'Broker ID é obrigatório'],
      index: true,
    },
    telegramChatId: {
      type: String,
      required: [true, 'Telegram Chat ID é obrigatório'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    state: {
      type: LeadStateSchema,
      default: () => ({}),
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    scoreHistory: [{
      score: { type: Number, required: true },
      reason: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    }],
    lastInteractionAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    firstInteractionAt: {
      type: Date,
      default: Date.now,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    claimedByBroker: {
      type: Boolean,
      default: false,
    },
    claimedAt: Date,
    tags: [{
      type: String,
      trim: true,
    }],
    notes: String,
    scheduledAppointment: {
      date: Date,
      location: String,
      notes: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for multi-tenant queries
LeadSchema.index({ brokerId: 1, isActive: 1, lastInteractionAt: -1 });
LeadSchema.index({ brokerId: 1, 'state.prontoParaCorretor': 1 });
LeadSchema.index({ brokerId: 1, score: -1 });
LeadSchema.index({ brokerId: 1, 'state.etapa': 1 });

// Methods
LeadSchema.methods.updateScore = function(this: ILead, newScore: number, reason: string): void {
  this.scoreHistory.push({
    score: newScore,
    reason,
    timestamp: new Date(),
  });
  this.score = Math.min(100, Math.max(0, newScore));
};

LeadSchema.methods.calculateProfile = function(this: ILead): PerfilEstimado {
  const { state } = this;
  
  // Lógica de determinação de perfil
  if (state.orcamentoEstimado) {
    const orcamento = state.orcamentoEstimado.toLowerCase();
    if (orcamento.includes('milhao') || orcamento.includes('1.') || orcamento.includes('2.')) {
      if (parseInt(orcamento.replace(/\D/g, '')) > 1000000) {
        return 'AltoPadrao';
      }
    }
    if (orcamento.includes('500') || orcamento.includes('600') || orcamento.includes('700') || orcamento.includes('800') || orcamento.includes('900')) {
      return 'MedioPadrao';
    }
    if (orcamento.includes('100') || orcamento.includes('200') || orcamento.includes('300')) {
      return 'MCMV';
    }
  }
  
  if (state.tipoImovel === 'cobertura' || state.tipoImovel === 'flat') {
    return 'AltoPadrao';
  }
  
  return 'Indefinido';
};

LeadSchema.methods.isQualified = function(this: ILead): boolean {
  return this.score >= 60 || this.state.prontoParaCorretor;
};

// Statics
LeadSchema.statics.findByChatId = function(chatId: string) {
  return this.findOne({ telegramChatId: chatId, isActive: true });
};

LeadSchema.statics.findByBroker = function(brokerId: string, options: any = {}) {
  const query = this.find({ brokerId, isActive: true });
  
  if (options.etapa) {
    query.where('state.etapa').equals(options.etapa);
  }
  
  if (options.prontoParaCorretor !== undefined) {
    query.where('state.prontoParaCorretor').equals(options.prontoParaCorretor);
  }
  
  if (options.sortBy) {
    query.sort(options.sortBy);
  } else {
    query.sort({ lastInteractionAt: -1 });
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query;
};

// Pre-save middleware
LeadSchema.pre('save', function(next) {
  if (this.isModified('state')) {
    // Recalcular perfil se estado mudou
    const newProfile = this.calculateProfile();
    if (newProfile !== 'Indefinido') {
      this.state.perfilEstimado = newProfile;
    }
  }
  next();
});

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
