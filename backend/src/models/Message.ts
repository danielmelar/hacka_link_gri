import mongoose, { Schema, Document, Types } from 'mongoose';

export type MessageDirection = 'inbound' | 'outbound';
export type MessageType = 'text' | 'image' | 'video' | 'document' | 'location' | 'contact';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  leadId: Types.ObjectId;
  brokerId: Types.ObjectId;
  
  // Origem e direção
  direction: MessageDirection;
  type: MessageType;
  
  // Conteúdo
  content: string;
  contentRaw?: any; // Dados brutos da mensagem do Telegram
  
  // Mídia (se aplicável)
  mediaUrl?: string;
  mediaCaption?: string;
  
  // Metadados de processamento
  metadata?: {
    // Informações do agente
    agentName?: string;
    agentType?: 'sofia' | 'especialista_familia' | 'especialista_alto_padrao';
    
    // NLP/IA
    intent?: string;
    entities?: Record<string, any>;
    sentiment?: 'positive' | 'neutral' | 'negative';
    confidence?: number;
    
    // Contexto
    contextUsed?: boolean;
    propertiesSuggested?: string[];
    stateChanged?: boolean;
    
    // Performance
    processingTimeMs?: number;
    tokensUsed?: number;
    modelUsed?: string;
  };
  
  // Status e entrega
  status: MessageStatus;
  telegramMessageId?: number;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  
  // Relacionamentos
  replyToMessageId?: Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: [true, 'Lead ID é obrigatório'],
      index: true,
    },
    brokerId: {
      type: Schema.Types.ObjectId,
      ref: 'Broker',
      required: [true, 'Broker ID é obrigatório'],
      index: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'document', 'location', 'contact'],
      default: 'text',
    },
    content: {
      type: String,
      required: [true, 'Conteúdo é obrigatório'],
    },
    contentRaw: Schema.Types.Mixed,
    mediaUrl: String,
    mediaCaption: String,
    metadata: {
      agentName: String,
      agentType: {
        type: String,
        enum: ['sofia', 'especialista_familia', 'especialista_alto_padrao'],
      },
      intent: String,
      entities: Schema.Types.Mixed,
      sentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative'],
      },
      confidence: Number,
      contextUsed: Boolean,
      propertiesSuggested: [String],
      stateChanged: Boolean,
      processingTimeMs: Number,
      tokensUsed: Number,
      modelUsed: String,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending',
    },
    telegramMessageId: Number,
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    failedAt: Date,
    errorMessage: String,
    replyToMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
MessageSchema.index({ leadId: 1, createdAt: -1 }); // Conversa de um lead
MessageSchema.index({ brokerId: 1, createdAt: -1 }); // Todas mensagens de um corretor
MessageSchema.index({ leadId: 1, direction: 1, createdAt: -1 }); // Mensagens por direção
MessageSchema.index({ brokerId: 1, direction: 1, status: 1 }); // Mensagens pendentes

// TTL index para limpar mensagens antigas (opcional - 2 anos)
// MessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

// Methods
MessageSchema.methods.markAsSent = function(this: IMessage, telegramMessageId: number): void {
  this.status = 'sent';
  this.telegramMessageId = telegramMessageId;
  this.sentAt = new Date();
};

MessageSchema.methods.markAsDelivered = function(this: IMessage): void {
  this.status = 'delivered';
  this.deliveredAt = new Date();
};

MessageSchema.methods.markAsRead = function(this: IMessage): void {
  this.status = 'read';
  this.readAt = new Date();
};

MessageSchema.methods.markAsFailed = function(this: IMessage, error: string): void {
  this.status = 'failed';
  this.failedAt = new Date();
  this.errorMessage = error;
};

// Statics
MessageSchema.statics.findByLead = function(leadId: string, options: any = {}) {
  const query = this.find({ leadId });
  
  if (options.direction) {
    query.where('direction').equals(options.direction);
  }
  
  query.sort({ createdAt: -1 });
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  return query;
};

MessageSchema.statics.findConversation = function(leadId: string, limit: number = 50) {
  return this.find({ leadId })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
};

MessageSchema.statics.getRecentForContext = function(leadId: string, limit: number = 10) {
  return this.find({ leadId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('direction content metadata.agentName createdAt')
    .lean();
};

MessageSchema.statics.getUnreadCount = function(brokerId: string) {
  return this.countDocuments({
    brokerId,
    direction: 'inbound',
    status: { $in: ['sent', 'delivered'] },
  });
};

MessageSchema.statics.getStatsByBroker = function(brokerId: string, since: Date) {
  return this.aggregate([
    {
      $match: {
        brokerId: new mongoose.Types.ObjectId(brokerId),
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: '$direction',
        count: { $sum: 1 },
        avgProcessingTime: {
          $avg: '$metadata.processingTimeMs',
        },
      },
    },
  ]);
};

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
