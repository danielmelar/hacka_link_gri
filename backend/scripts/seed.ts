#!/usr/bin/env tsx
/**
 * Seed script for LinkGRI MVP
 * Creates sample data for testing
 */

import mongoose from 'mongoose';
import { Broker } from '../src/models/Broker';
import { Lead } from '../src/models/Lead';
import { Property } from '../src/models/Property';
import { Message } from '../src/models/Message';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { logger } from '../src/utils/logger';

async function seedDatabase(): Promise<void> {
  try {
    logger.info('🌱 Starting database seed...');
    
    await connectDatabase();
    
    // Clear existing data
    await clearData();
    
    // Create sample broker
    const broker = await createSampleBroker();
    
    // Create sample properties
    const properties = await createSampleProperties(broker._id.toString());
    
    // Create sample leads
    const leads = await createSampleLeads(broker._id.toString());
    
    // Create sample messages
    await createSampleMessages(leads);
    
    logger.info('✅ Database seed completed successfully!');
    logger.info('');
    logger.info('📋 Sample Data:');
    logger.info(`   Broker: ${broker.name} (${broker.email})`);
    logger.info(`   API Token: ${broker.apiToken}`);
    logger.info(`   Deep Link Token: ${broker.deepLinkToken}`);
    logger.info(`   Deep Link: https://t.me/LinkGRIBot?start=${broker.deepLinkToken}`);
    logger.info('');
    logger.info(`   Properties: ${properties.length}`);
    logger.info(`   Leads: ${leads.length}`);
    
  } catch (error) {
    logger.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

async function clearData(): Promise<void> {
  logger.info('Clearing existing data...');
  
  await Message.deleteMany({});
  await Lead.deleteMany({});
  await Property.deleteMany({});
  await Broker.deleteMany({});
  
  logger.info('Existing data cleared');
}

async function createSampleBroker(): Promise<any> {
  logger.info('Creating sample broker...');
  
  const broker = await Broker.create({
    name: 'João Corretor',
    email: 'joao@linkgri.com',
    phone: '+55 11 99999-9999',
    password: 'senha123456', // Will be hashed by pre-save hook
    plan: 'pro',
    settings: {
      notificationEmail: true,
      notificationPush: true,
      autoQualification: true,
      workingHours: {
        start: '09:00',
        end: '18:00',
        timezone: 'America/Sao_Paulo',
      },
    },
    isActive: true,
  });
  
  logger.info(`Broker created: ${broker.name}`);
  return broker;
}

async function createSampleProperties(brokerId: string): Promise<any[]> {
  logger.info('Creating sample properties...');
  
  const properties = [
    {
      brokerId,
      title: 'Apartamento Luxo - Vila Olímpia',
      description: 'Apartamento de alto padrão em uma das regiões mais valorizadas de São Paulo. Acabamento impecável, vista panorâmica e infraestrutura completa de lazer.',
      price: 2500000,
      priceType: 'venda',
      type: 'apartamento',
      status: 'disponivel',
      bedrooms: 3,
      bathrooms: 3,
      suites: 2,
      parkingSpots: 2,
      area: 180,
      address: {
        street: 'Rua da Mata',
        number: '123',
        neighborhood: 'Vila Olímpia',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04551-060',
      },
      features: ['piscina', 'academia', 'playground', 'seguranca_24h', 'salao_festas', 'churrasqueira'],
      targetProfile: ['alto_padrao', 'familia'],
      images: [
        { url: 'https://example.com/apt1-1.jpg', isMain: true },
        { url: 'https://example.com/apt1-2.jpg' },
      ],
      active: true,
      featured: true,
    },
    {
      brokerId,
      title: 'Casa em Condomínio - Alphaville',
      description: 'Casa espaçosa em condomínio fechado, perfeita para famílias. Amplo quintal, área de lazer privativa e segurança 24 horas.',
      price: 1800000,
      priceType: 'venda',
      type: 'casa',
      status: 'disponivel',
      bedrooms: 4,
      bathrooms: 4,
      suites: 3,
      parkingSpots: 4,
      area: 350,
      address: {
        street: 'Alameda Rio Negro',
        number: '456',
        neighborhood: 'Alphaville',
        city: 'Barueri',
        state: 'SP',
        zipCode: '06454-000',
      },
      features: ['piscina', 'quintal', 'seguranca_24h', 'area_gourmet', 'escritorio'],
      targetProfile: ['familia', 'alto_padrao'],
      images: [
        { url: 'https://example.com/casa1-1.jpg', isMain: true },
      ],
      active: true,
      featured: true,
    },
    {
      brokerId,
      title: 'Apartamento Família - Moema',
      description: 'Apartamento perfeito para famílias com crianças. Condomínio com excelente infraestrutura de lazer, próximo a escolas e parques.',
      price: 850000,
      priceType: 'venda',
      type: 'apartamento',
      status: 'disponivel',
      bedrooms: 3,
      bathrooms: 2,
      suites: 1,
      parkingSpots: 2,
      area: 95,
      address: {
        street: 'Rua Canário',
        number: '789',
        neighborhood: 'Moema',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '04521-010',
      },
      features: ['playground', 'piscina', 'salao_festas', 'seguranca_24h'],
      targetProfile: ['familia', 'primeiro_imovel'],
      images: [
        { url: 'https://example.com/apt2-1.jpg', isMain: true },
      ],
      active: true,
      featured: false,
    },
    {
      brokerId,
      title: 'Cobertura Duplex - Jardins',
      description: 'Cobertura duplex de luxo com vista espetacular. Piscina privativa, terraço gourmet e acabamentos de primeira linha.',
      price: 5500000,
      priceType: 'venda',
      type: 'cobertura',
      status: 'disponivel',
      bedrooms: 4,
      bathrooms: 5,
      suites: 4,
      parkingSpots: 4,
      area: 450,
      address: {
        street: 'Rua Oscar Freire',
        number: '1000',
        neighborhood: 'Jardins',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01426-001',
      },
      features: ['piscina', 'terraço', 'vista_panoramica', 'elevador_privativo', 'seguranca_24h'],
      targetProfile: ['alto_padrao', 'investidor'],
      images: [
        { url: 'https://example.com/cobertura1-1.jpg', isMain: true },
      ],
      active: true,
      featured: true,
    },
    {
      brokerId,
      title: 'Apartamento Studio - Centro',
      description: 'Studio compacto e moderno, perfeito para investimento ou moradia de jovem profissional. Ótima localização e valorização.',
      price: 320000,
      priceType: 'venda',
      type: 'apartamento',
      status: 'disponivel',
      bedrooms: 1,
      bathrooms: 1,
      suites: 0,
      parkingSpots: 1,
      area: 35,
      address: {
        street: 'Rua Direita',
        number: '200',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01002-001',
      },
      features: ['academia', 'lavanderia'],
      targetProfile: ['jovens', 'investidor', 'primeiro_imovel'],
      images: [
        { url: 'https://example.com/studio1-1.jpg', isMain: true },
      ],
      active: true,
      featured: false,
    },
  ];
  
  const createdProperties = await Property.insertMany(properties);
  logger.info(`Created ${createdProperties.length} properties`);
  
  return createdProperties;
}

async function createSampleLeads(brokerId: string): Promise<any[]> {
  logger.info('Creating sample leads...');
  
  const leads = [
    {
      brokerId,
      telegramChatId: '123456789',
      name: 'Maria Silva',
      phone: '+55 11 98888-8888',
      state: {
        perfilEstimado: 'MedioPadrao',
        temFilhos: true,
        quantosFilhos: 2,
        dorPrincipal: 'Espaço para crianças',
        orcamentoEstimado: 'até 900 mil',
        regiaoInteresse: 'Moema',
        tipoImovel: 'apartamento',
        urgencia: 'media',
        agenteAtual: 'Especialista_Familia',
        prontoParaCorretor: true,
        etapa: 'agendamento',
      },
      score: 75,
      lastInteractionAt: new Date(),
      firstInteractionAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      totalMessages: 12,
      isActive: true,
      claimedByBroker: false,
      tags: ['familia', 'qualificado'],
    },
    {
      brokerId,
      telegramChatId: '987654321',
      name: 'Carlos Mendes',
      state: {
        perfilEstimado: 'AltoPadrao',
        temFilhos: false,
        quantosFilhos: null,
        dorPrincipal: 'Investimento',
        orcamentoEstimado: 'até 3 milhões',
        regiaoInteresse: 'Jardins',
        tipoImovel: 'cobertura',
        urgencia: 'baixa',
        agenteAtual: 'Especialista_Alto_Padrao',
        prontoParaCorretor: false,
        etapa: 'qualificacao',
      },
      score: 60,
      lastInteractionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      firstInteractionAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      totalMessages: 5,
      isActive: true,
      claimedByBroker: false,
      tags: ['investidor', 'alto_padrao'],
    },
    {
      brokerId,
      telegramChatId: '555666777',
      name: 'Ana Paula',
      state: {
        perfilEstimado: 'Indefinido',
        temFilhos: null,
        quantosFilhos: null,
        dorPrincipal: null,
        orcamentoEstimado: null,
        regiaoInteresse: null,
        tipoImovel: null,
        urgencia: null,
        agenteAtual: 'SDR_Geral',
        prontoParaCorretor: false,
        etapa: 'inicio',
      },
      score: 5,
      lastInteractionAt: new Date(),
      firstInteractionAt: new Date(),
      totalMessages: 1,
      isActive: true,
      claimedByBroker: false,
      tags: ['novo'],
    },
  ];
  
  const createdLeads = await Lead.insertMany(leads);
  logger.info(`Created ${createdLeads.length} leads`);
  
  return createdLeads;
}

async function createSampleMessages(leads: any[]): Promise<void> {
  logger.info('Creating sample messages...');
  
  const messages = [];
  
  // Messages for Maria Silva (lead 0)
  const mariaMessages = [
    {
      leadId: leads[0]._id,
      brokerId: leads[0].brokerId,
      direction: 'inbound',
      type: 'text',
      content: 'Olá! Vi o anúncio no Instagram e gostaria de saber mais sobre imóveis para família.',
      status: 'read',
    },
    {
      leadId: leads[0]._id,
      brokerId: leads[0].brokerId,
      direction: 'outbound',
      type: 'text',
      content: 'Oi Maria! 👋 Que bom que entrou em contato! Sou a Sofia, consultora imobiliária.\n\nVou te ajudar a encontrar o imóvel perfeito para sua família. Me conta: quantos filhos você tem?',
      metadata: { agentName: 'sofia', agentType: 'sofia' },
      status: 'read',
    },
    {
      leadId: leads[0]._id,
      brokerId: leads[0].brokerId,
      direction: 'inbound',
      type: 'text',
      content: 'Tenho 2 filhos, de 5 e 8 anos. Estamos procurando um apartamento com espaço para eles brincarem.',
      status: 'read',
    },
    {
      leadId: leads[0]._id,
      brokerId: leads[0].brokerId,
      direction: 'outbound',
      type: 'text',
      content: 'Que idade especial! 🏠✨ Com crianças nessa faixa etária, segurança e lazer são fundamentais.\n\nTenho algumas opções excelentes em Moema com playground monitorado e piscina. Qual seria seu orçamento aproximado?',
      metadata: { agentName: 'especialista_familia', agentType: 'especialista_familia' },
      status: 'read',
    },
  ];
  
  messages.push(...mariaMessages);
  
  await Message.insertMany(messages);
  logger.info(`Created ${messages.length} messages`);
}

// Run seed
seedDatabase();
