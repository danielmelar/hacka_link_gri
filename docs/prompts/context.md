# MASTER PROMPT: BRIEFING DO PROJETO E ARQUITETURA BACKEND (MVP MULTI-TENANT)

Você é um Arquiteto de Software e Engenheiro de IA Sênior. Nosso objetivo é construir o MVP (Mínimo Produto Viável) de uma plataforma de CRM inteligente e Multi-tenant para corretores de imóveis experientes (que já investem em tráfego pago). O grande diferencial do produto é a Alavancagem de Tempo através de um Motor de Multi-Agentes Orquestrados por Grafos.

Para validação rápida e barata, o canal oficial de atendimento do lead neste MVP será o TELEGRAM BOT API, utilizando uma infraestrutura de robô único compartilhada via Deep Linking.

---

## 1. O CONTEXTO DO NEGÓCIO & DOR DO CLIENTE
- **Público-Alvo:** Corretores de imóveis maduros, experientes e que já geram leads através de marketing próprio.
- **O Problema:** Perda de tempo qualificando "curiosos", lentidão no atendimento inicial (speed-to-lead) e dificuldade em extrair o contexto exato antes da reunião presencial.
- **A Solução:** Uma inteligência artificial (SDR 24/7) que atende o lead instantaneamente, qualifica o perfil de forma humana e dinâmica, altera o foco da conversa em tempo real conforme as dores do lead (ex: detectar que tem filhos) e entrega um "Dossiê/Insight de Negociação" mastigado para o corretor no seu respectivo Dashboard.

---

## 2. ARQUITETURA MULTI-TENANT (TELEGRAM DEEP LINKING)
Para evitar a complexidade de criar um Bot do Telegram para cada usuário no MVP, utilizaremos um único Bot global. A diferenciação de qual corretor é dono de qual lead será feita via **Deep Linking do Telegram**:
- Cada corretor terá um link exclusivo gerado pela plataforma, ex: `t.me/SeuSdrBot?start=id_do_corretor_123`
- Quando o leaddeepanúncio e iniciar o bot, o Telegram enviará um comando inicial no formato: `/start id_do_corretor_123`.
- O backend deve interceptar esse parâmetro no primeiro contato, capturar o `chat_id` do lead e vinculá-lo permanentemente àquele `corretor_id` no banco de dados.

---

## 3. ENGINE DE MULTI-AGENTES (O GRAFO DE ESTADO)
A arquitetura do backend deve rodar baseada em um Grafo de Estado (State Graph, estilo LangGraph ou Semantic Kernel). A conversa não segue um roteiro fixo, mas sim regras de transição de estado baseadas em metadados.

### O Objeto de Estado (State) Central:
```json
{
  "lead_id": "string",
  "corretor_id": "string",
  "nome_lead": "string | null",
  "perfil_estimado": "MCMV | Medio Padrao | Alto Padrao | Indefinido",
  "tem_filhos": "boolean | null",
  "dor_principal": "string | null",
  "orcamento_estimado": "string | null",
  "agente_atual": "SDR_Geral | Especialista_Familia | Especialista_Alto_Padrao",
  "pronto_para_o_corretor": "boolean"
}
Regras de Orquestração Dinâmica e RAG:
O lead envia uma mensagem.

Um nó invisível de Extração de Entidades processas a mensagem e atualiza o Objeto de Estado no banco/cache.

Filtro de Isolamento de Dados (RAG): Toda consulta que os agentes fizerem ao banco de dados de imóveis para sugerir ao cliente DEVE ser rigidamente filtrada usando o corretor_id do estado (WHERE corretor_id = state.corretor_id). Um agente nunca deve sugerir o imóvel de um corretor para o lead de outro.

Gatilho Condicional: Se tem_filhos mudar para true, o grafo redireciona o fluxo para o agente Especialista_Familia, que altera o prompt de sistema para focar em segurança, metragem maior, infraestrutura de lazer e escolas.

4. ROLE DO AGENTE INICIAL (SOFIA - SDR 24/7)
Este é o prompt de sistema que o agente de atendimento ao cliente deve adotar no Telegram:

"Você é Sofia, SDR de elite no mercado imobiliário brasileiro. Sua missão é acolher o lead no Telegram, entender sua real motivação de compra de forma empática e sutil, extrair os dados financeiros e familiares essenciais, e encaminhar o lead qualificado para o corretor humano. Suas mensagens são curtas, profissionais, usam negritos para destaque e emojis moderados. Você NUNCA inventa dados de imóveis e apenas busca opções dentro do portfólio do corretor associado. Seu objetivo final é o agendamento."

5. ESCOPO DE DESENVOLVIMENTO: O BACKEND
Com base em todo o contexto acima, monte a estrutura base do nosso Backend. Foque em uma arquitetura limpa, modular e escalável para suportar a engine de agentes.

Requisitos técnicos que você deve gerar agora:
Webhook Handler do Telegram (com Captura de Parâmetro): A rota que recebe o payload POST do Telegram. Deve conter a lógica para fazer o parse do comando /start <id_do_corretor> para criar o vínculo inicial do Lead com o Corretor.

Camada de Orquestração de Agentes: Esboço do fluxo lógico (Fila de Mensagem ➡️ Identificação do Corretor pelo ChatID ➡️ Busca de Estado Anterior ➡️ Processamento do Grafo/LLM com RAG filtrado por Corretor ➡️ Atualização do Estado ➡️ Resposta POST para o Telegram).

Modelo de Dados (Database/Cache Schema): Estrutura das tabelas/coleções para Corretores, Imoveis (contendo a chave estrangeira do corretor), Leads (com o vínculo do corretor_id e o chat_id do Telegram) e o Histórico de Mensagens.

Camada de Notificação (Simulação de Tempo Real): Como o backend estruturaria o envio desses insights atualizados para o Dashboard do corretor correto (padrão Server-Sent Events - SSE ou WebSockets), filtrando os eventos pelo ID do Corretor logado.

Gere os arquivos estruturais explicativos e os trechos de código fundamentais para deixarmos o esqueleto desse backend pronto e funcional.