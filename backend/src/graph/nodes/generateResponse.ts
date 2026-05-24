import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Lead } from '../../models/Lead';
import { getAgentConfig } from '../../agents/config';
import { searchRelevantProperties } from '../../services/rag/propertySearch';
import type { AgentGraphState } from '../../types';
import {
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  OPENROUTER_HTTP_REFERER,
  OPENROUTER_APP_NAME,
} from '../../config/env';
import { logger } from '../../utils/logger';

export async function generateResponse(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
  const startTime = Date.now();
  
  try {
    logger.info(`Generating response for lead ${state.leadId} with agent ${state.currentAgent}`);
    
    // Get agent configuration
    const agentConfig = getAgentConfig(state.currentAgent);
    
    // Fetch lead data
    const lead = await Lead.findById(state.leadId);
    if (!lead) {
      throw new Error(`Lead not found: ${state.leadId}`);
    }
    
    // Search for relevant properties
    const properties = await searchRelevantProperties(
      state.brokerId,
      state.extractedEntities,
      lead.state
    );
    
    // Build conversation history — last 20 messages for context
    // The first message in state.messages is always the current inbound message;
    // everything before it is the loaded history from DB.
    const allMessages = state.messages;
    const isFirstMessage = allMessages.filter(m => m.role === 'user').length <= 1
      && allMessages.filter(m => m.role === 'assistant').length === 0;

    const conversationHistory = allMessages.slice(-20).map(m => ({
      role: m.role,
      content: m.content,
    }));
    
    // Build properties context
    const formatPrice = (price: number): string => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(price);
    };

    const propertiesContext = properties.length > 0
      ? properties.map(p => `
Imóvel: ${p.title}
Preço: ${formatPrice(p.price)}
Tipo: ${p.type}
Quartos: ${p.bedrooms} | Banheiros: ${p.bathrooms} | Área: ${p.area}m²
Bairro: ${p.address?.neighborhood || 'N/A'}, ${p.address?.city || 'N/A'}
Características: ${(p.features || []).join(', ')}
Descrição: ${(p.description || '').substring(0, 200)}...
`).join('\n---\n')
      : 'Nenhum imóvel específico disponível no momento. Foque em entender melhor as necessidades do lead.';
    
    // Build state context
    const stateContext = {
      leadName: lead.name || 'não informado',
      perfilEstimado: lead.state.perfilEstimado,
      temFilhos: lead.state.temFilhos === null ? 'não informado' : lead.state.temFilhos ? 'sim' : 'não',
      quantosFilhos: lead.state.quantosFilhos || 'não informado',
      orcamentoEstimado: lead.state.orcamentoEstimado || 'não informado',
      regiaoInteresse: lead.state.regiaoInteresse || 'não informada',
      tipoImovel: lead.state.tipoImovel || 'não informado',
      etapa: lead.state.etapa,
      agenteAtual: lead.state.agenteAtual,
    };
    
    // Replace placeholders in system prompt
    let systemPrompt = agentConfig.systemPrompt
      .replace('{leadName}', stateContext.leadName)
      .replace('{perfilEstimado}', stateContext.perfilEstimado)
      .replace('{temFilhos}', stateContext.temFilhos)
      .replace('{quantosFilhos}', String(stateContext.quantosFilhos))
      .replace('{orcamentoEstimado}', stateContext.orcamentoEstimado)
      .replace('{regiaoInteresse}', stateContext.regiaoInteresse)
      .replace('{tipoImovel}', stateContext.tipoImovel)
      .replace('{etapa}', stateContext.etapa)
      .replace('{agenteAtual}', stateContext.agenteAtual)
      .replace('{propertiesContext}', propertiesContext)
      .replace('{isFirstMessage}', isFirstMessage ? 'SIM — esta é a PRIMEIRA mensagem do lead. Apresente-se.' : 'NÃO — já existe histórico de conversa. NÃO se apresente novamente. Continue a conversa de onde parou, com base no histórico acima.')
      .replace('{idadeFilhos}', lead.state.quantosFilhos ? 'informado anteriormente' : 'não informado')
      .replace('{urgencia}', lead.state.urgencia ?? 'não informada')
      // Remove any remaining unreplaced placeholders to avoid LangChain template errors
      .replace(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g, '—');
    
    // Build messages directly — avoids LangChain template variable parsing
    // since systemPrompt is already fully resolved (no {placeholders} left)
    const { SystemMessage, HumanMessage, AIMessage } = await import('@langchain/core/messages');

    const messages = [
      new SystemMessage(systemPrompt),
      ...conversationHistory.map(m =>
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
    ];

    // Generate response via OpenRouter
    const model = new ChatOpenAI({
      modelName: agentConfig.model,
      temperature: agentConfig.temperature,
      maxTokens: agentConfig.maxTokens,
      apiKey: OPENROUTER_API_KEY,
      configuration: {
        baseURL: OPENROUTER_BASE_URL,
        defaultHeaders: {
          'HTTP-Referer': OPENROUTER_HTTP_REFERER,
          'X-Title': OPENROUTER_APP_NAME,
        },
      },
    });

    const response = await model.invoke(messages);
    
    const processingTime = Date.now() - startTime;
    
    logger.info(`Response generated in ${processingTime}ms`, {
      leadId: state.leadId,
      agent: state.currentAgent,
      responseLength: response.content.length,
    });
    
    return {
      response: response.content as string,
      suggestedProperties: properties.map(p => p._id.toString()),
      metadata: {
        ...state.metadata,
        generationTimeMs: processingTime,
        modelUsed: agentConfig.model,
        tokensUsed: (response as any).usage?.total_tokens,
        propertiesFound: properties.length,
      },
    };
  } catch (error) {
    logger.error('Error generating response:', error);
    
    // Return fallback response on error
    return {
      response: 'Desculpe, tive um problema técnico. Pode repetir sua mensagem? 😊',
      metadata: {
        ...state.metadata,
        generationError: (error as Error).message,
      },
    };
  }
}
