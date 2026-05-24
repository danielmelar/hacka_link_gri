import mongoose, { Schema, Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { PlanoBroker } from '../types';

export interface IBroker extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password: string; // hashed
  deepLinkToken: string;
  apiToken: string;
  telegramBotToken?: string;
  plan: PlanoBroker;
  settings: {
    notificationEmail: boolean;
    notificationPush: boolean;
    autoQualification: boolean;
    workingHours: {
      start: string;
      end: string;
      timezone: string;
    };
  };
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  generateDeepLink(botUsername: string): string;
  getPublicProfile(): Partial<IBroker>;
}

const BrokerSchema = new Schema<IBroker>(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome não pode ter mais de 100 caracteres'],
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Telefone inválido'],
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [8, 'Senha deve ter no mínimo 8 caracteres'],
      select: false, // Don't include by default
    },
    deepLinkToken: {
      type: String,
      unique: true,
      default: () => uuidv4().replace(/-/g, '').substring(0, 16),
    },
    apiToken: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
    telegramBotToken: {
      type: String,
      select: false,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    settings: {
      notificationEmail: { type: Boolean, default: true },
      notificationPush: { type: Boolean, default: true },
      autoQualification: { type: Boolean, default: true },
      workingHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
        timezone: { type: String, default: 'America/Sao_Paulo' },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes only (unique fields already have indexes)
BrokerSchema.index({ isActive: 1, plan: 1 });

// Virtual for deep link URL
BrokerSchema.virtual('deepLink').get(function(this: IBroker) {
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'clavisapp_bot';
  return `https://t.me/${botUsername}?start=${this.deepLinkToken}`;
});

// Methods
BrokerSchema.methods.generateDeepLink = function(this: IBroker, botUsername: string): string {
  return `https://t.me/${botUsername}?start=${this.deepLinkToken}`;
};

BrokerSchema.methods.getPublicProfile = function(this: IBroker): Partial<IBroker> {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    plan: this.plan,
    deepLinkToken: this.deepLinkToken,
    createdAt: this.createdAt,
  };
};

// Static methods
BrokerSchema.statics.findByDeepLinkToken = function(token: string) {
  return this.findOne({ deepLinkToken: token, isActive: true });
};

BrokerSchema.statics.findByApiToken = function(token: string) {
  return this.findOne({ apiToken: token, isActive: true });
};

export const Broker = mongoose.model<IBroker>('Broker', BrokerSchema);
