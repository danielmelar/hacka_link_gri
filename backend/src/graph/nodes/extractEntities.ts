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
import { Lead } from '../../models/Lead';

const extractionPrompt = ChatPromptTemplate.fromMessages([
  ['system', `Você é um assistente especializado em extrair informações de conversas imobiliárias.

SUA TAREFA: Analisar a mensagem do usuário e extrair informações relevantes.

REGRAS IMPORTANTES:
1. Você receberá o ESTADO ATUAL do lead (o que já sabemos) e a NOVA MENSAGEM.
2. Extraia APENAS informações que são NOVAS ou que CORRIGEM dados existentes.
3. Se um dado já está no estado atual e a mensagem não o contradiz, mantenha-o (não retorne null para ele).
4. Se a mensagem contradizer um dado existente, use o valor da mensagem.
5. Se a mensagem não mencionar um campo, retorne null para ele (o sistema ignorará nulls).

ENTIDADES A EXTRAIR:
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

Retorne APENAS um objeto JSON válido com as entidades encontradas. Use null para valores não encontrados na mensagem atual.
Exemplo de resposta:
{{"nome": null, "temFilhos": true, "quantosFilhos": null, "orcamento": null, "tipoImovel": null, "urgencia": null}}`],
  ['human', `ESTADO ATUAL DO LEAD:
{currentState}

NOVA MENSAGEM DO USUÁRIO:
{message}`],
]);

export async function extractEntities(state: AgentGraphState): Promise<Partial<AgentGraphState>> {
  const startTime = Date.now();

  try {
    logger.info(`Extracting entities for lead ${state.leadId}`);

    // Fetch current lead state to provide context to the LLM
    const lead = await Lead.findById(state.leadId);
    const currentState = lead
      ? JSON.stringify({
          nome: lead.name || null,
          telefone: lead.phone || null,
          email: lead.email || null,
          temFilhos: lead.state.temFilhos,
          quantosFilhos: lead.state.quantosFilhos,
          idadeFilhos: null,
          orcamento: lead.state.orcamentoEstimado,
          regiaoInteresse: lead.state.regiaoInteresse,
          tipoImovel: lead.state.tipoImovel,
          urgencia: lead.state.urgencia,
          motivacaoCompra: lead.state.dorPrincipal,
          dataPossivelVisita: null,
        }, null, 2)
      : 'Nenhum dado anterior';

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
    const entities = await chain.invoke({
      message: lastMessage.content,
      currentState,
    });

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
