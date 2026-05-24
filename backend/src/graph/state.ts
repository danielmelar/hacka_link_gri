import type { AgentGraphState, ExtractedEntities } from '../types';

// Initial state factory
export function createInitialState(
  leadId: string,
  brokerId: string,
  userMessage: string
): AgentGraphState {
  return {
    leadId,
    brokerId,
    messages: [
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      },
    ],
    extractedEntities: {},
    currentAgent: 'sofia',
    shouldEscalate: false,
    suggestedProperties: [],
    response: '',
    metadata: {},
  };
}

// State channels for LangGraph
export const agentStateChannels = {
  leadId: {
    value: (x: string, y?: string) => y ?? x,
    default: () => '',
  },
  brokerId: {
    value: (x: string, y?: string) => y ?? x,
    default: () => '',
  },
  messages: {
    value: (x: any[], y?: any[]) => y ? [...x, ...y] : x,
    default: () => [],
  },
  extractedEntities: {
    value: (x: ExtractedEntities, y?: ExtractedEntities) => {
      if (!y) return x;
      // Deep merge: only overwrite with explicitly defined values (not null/undefined)
      // This preserves accumulated entities across messages
      const merged: ExtractedEntities = { ...x };
      for (const [key, val] of Object.entries(y)) {
        if (val !== undefined && val !== null) {
          (merged as any)[key] = val;
        }
      }
      return merged;
    },
    default: () => ({}),
  },
  currentAgent: {
    value: (x: string, y?: string) => y ?? x,
    default: () => 'sofia',
  },
  shouldEscalate: {
    value: (x: boolean, y?: boolean) => y ?? x,
    default: () => false,
  },
  suggestedProperties: {
    value: (x: string[], y?: string[]) => y ?? x,
    default: () => [],
  },
  response: {
    value: (x: string, y?: string) => y ?? x,
    default: () => '',
  },
  metadata: {
    value: (x: any, y?: any) => ({ ...x, ...y }),
    default: () => ({}),
  },
};
