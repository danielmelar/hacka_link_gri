import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Lead } from '../../models/Lead';
import { getAgentConfig } from '../../agents/config';
import { searchRelevantProperties } from '../../services/rag/propertySearch';
import type { AgentGraphState } from '../../types';
import { OPENAI_API_KEY } from '../../config/env';
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
    
    // Build conversation history
    const conversationHistory = state.messages.slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    }));
    
    // Build properties context
    const propertiesContext = properties.length > 0
      ? properties.map(p => `
Imóvel: ${p.title}
Preço: ${p.priceFormatted}
Tipo: ${p.type}
Quartos: ${p.bedrooms} | Banheiros: ${p.bathrooms} | Área: ${p.area}m²
Bairro: ${p.address.neighborhood}, ${p.address.city}
Características: ${p.features.join(', ')}
Descrição: ${p.description.substring(0, 200)}...
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
      .replace('{propertiesContext}', propertiesContext);
    
    // Create prompt
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ...conversationHistory.map(m => [m.role, m.content] as [string, string]),
    ]);
    
    // Generate response
    const model = new ChatOpenAI({
      modelName: agentConfig.model,
      temperature: agentConfig.temperature,
      maxTokens: agentConfig.maxTokens,
      openAIApiKey: OPENAI_API_KEY,
    });
    
    const chain = prompt.pipe(model);
    const response = await chain.invoke({});
    
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
