import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import type { AgentGraphState } from '../../types';
import {
  OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL,
  OPENROUTER_HTTP_REFERER,
  OPENROUTER_APP_NAME,
  OPENROUTER_MODEL,
} from '../../config/env';
import { logger } from '../../utils/logger';

const extractionPrompt = ChatPromptTemplate.fromMessages([
  ['system', `Você é um assistente especializado em extrair informações de conversas imobiliárias.

Extraia as seguintes entidades da mensagem do usuário:
- nome: Nome da pessoa (se mencionado)
- telefone: Número de telefone
- email: Endereço de email
- temFilhos: true/false se mencionar ter filhos
- quantosFilhos: Número de filhos (se especificado)
- idadeFilhos: Faixa etária dos filhos (ex: "3 e 5 anos", "adolescentes")
- orcamento: Faixa de preço mencionada (ex: "até 500 mil", "entre 800 e 1 milhão")
- regiaoInteresse: Bairro, cidade ou região mencionada
- tipoImovel: Tipo do imóvel (apartamento, casa, terreno, comercial, cobertura, flat)
- urgencia: Nível de urgência (baixa, media, alta)
- motivacaoCompra: Motivo da compra (morar, investir, trocar de casa)
- dataPossivelVisita: Data ou período mencionado para visita

Retorne APENAS um objeto JSON válido com as entidades encontradas. Use null para valores não encontrados.
Exemplo de resposta:
{
  "nome": "João Silva",
  "temFilhos": true,
  "quantosFilhos": 2,
  "orcamento": "até 600 mil",
  "tipoImovel": "apartamento",
  "urgencia": "media"
}`],
  ['human', '{message}'],
]);

export async function extractEntities(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
  const startTime = Date.now();
  
  try {
    logger.info(`Extracting entities for lead ${state.leadId}`);
    
    const model = new ChatOpenAI({
      modelName: OPENROUTER_MODEL,
      temperature: 0,
      apiKey: OPENROUTER_API_KEY,
      configuration: {
        baseURL: OPENROUTER_BASE_URL,
        defaultHeaders: {
          'HTTP-Referer': OPENROUTER_HTTP_REFERER,
          'X-Title': OPENROUTER_APP_NAME,
        },
      },
    });
    
    const chain = extractionPrompt.pipe(model).pipe(new JsonOutputParser());
    
    const lastMessage = state.messages[state.messages.length - 1];
    const entities = await chain.invoke({ message: lastMessage.content });
    
    const processingTime = Date.now() - startTime;
    
    logger.info(`Entities extracted in ${processingTime}ms`, { entities });
    
    return {
      extractedEntities: entities,
      metadata: {
        ...state.metadata,
        extractionTimeMs: processingTime,
      },
    };
  } catch (error) {
    logger.error('Error extracting entities:', error);
    
    // Return empty entities on error to continue flow
    return {
      extractedEntities: {},
      metadata: {
        ...state.metadata,
        extractionError: (error as Error).message,
      },
    };
  }
}
