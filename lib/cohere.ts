import { ChatCohere } from '@langchain/cohere';

// Initialize LangChain Cohere chat model
const cohereChatModel = new ChatCohere({
  apiKey: process.env.COHERE_API_KEY,
  model: 'command-r-plus',
  temperature: 0.7,
});

// Helper function to validate API key
export function validateCohereApiKey(): boolean {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey) {
    console.error('COHERE_API_KEY environment variable is not set');
    return false;
  }
  return true;
}

// Helper function to get LangChain Cohere model with validation
export function getCohereChatModel(): ChatCohere {
  if (!validateCohereApiKey()) {
    throw new Error('Cohere API key is not configured');
  }
  return cohereChatModel;
}
