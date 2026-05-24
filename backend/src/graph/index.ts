import { StateGraph, END } from '@langchain/langgraph';
import { agentStateChannels } from './state';
import { extractEntities } from './nodes/extractEntities';
import { updateLeadState } from './nodes/updateLeadState';
import { selectAgent } from './nodes/selectAgent';
import { generateResponse } from './nodes/generateResponse';
import { sendResponse } from './nodes/sendResponse';
import type { AgentGraphState } from '../types';
import { logger } from '../utils/logger';

// Create the workflow
const workflow = new StateGraph<AgentGraphState>({
  channels: agentStateChannels,
});

// Add nodes
workflow.addNode('extract_entities', extractEntities);
workflow.addNode('update_lead_state', updateLeadState);
workflow.addNode('select_agent', selectAgent);
workflow.addNode('generate_response', generateResponse);
workflow.addNode('send_response', sendResponse);

// Define edges
workflow.setEntryPoint('extract_entities');
workflow.addEdge('extract_entities', 'update_lead_state');
workflow.addEdge('update_lead_state', 'select_agent');
workflow.addEdge('select_agent', 'generate_response');
workflow.addEdge('generate_response', 'send_response');
workflow.addEdge('send_response', END);

// Compile the graph
export const agentGraph = workflow.compile();

// Main function to process a message through the graph
export async function processMessage(
  leadId: string,
  brokerId: string,
  message: string,
  conversationHistory: any[] = []
): Promise<AgentGraphState> {
  const startTime = Date.now();
  
  logger.info(`Starting graph processing for lead ${leadId}`, {
    messageLength: message.length,
    historyLength: conversationHistory.length,
  });
  
  // Build initial state
  const initialState: AgentGraphState = {
    leadId,
    brokerId,
    messages: [
      ...conversationHistory,
      {
        role: 'user',
        content: message,
        timestamp: new Date(),
      },
    ],
    extractedEntities: {},
    currentAgent: 'sofia',
    shouldEscalate: false,
    suggestedProperties: [],
    response: '',
    metadata: {
      startTime: new Date().toISOString(),
    },
  };
  
  try {
    // Run the graph
    const result = await agentGraph.invoke(initialState);
    
    const totalTime = Date.now() - startTime;
    logger.info(`Graph processing completed in ${totalTime}ms`, {
      leadId,
      agent: result.currentAgent,
      responseLength: result.response.length,
    });
    
    return result;
  } catch (error) {
    logger.error('Error in graph processing:', error);
    throw error;
  }
}

// Export individual nodes for testing
export {
  extractEntities,
  updateLeadState,
  selectAgent,
  generateResponse,
  sendResponse,
};
