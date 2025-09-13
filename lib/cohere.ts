import { CohereClient } from 'cohere-ai';
import { ChatCohere } from '@langchain/cohere';

// Initialize Cohere client
export const cohereClient = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// Initialize LangChain Cohere chat model
export const cohereChatModel = new ChatCohere({
  apiKey: process.env.COHERE_API_KEY,
  model: 'command-r-plus', // You can change this to other models like 'command-r', 'command', etc.
  temperature: 0.7,
  maxTokens: 1000,
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

// Helper function to get Cohere client with validation
export function getCohereClient(): CohereClient {
  if (!validateCohereApiKey()) {
    throw new Error('Cohere API key is not configured');
  }
  return cohereClient;
}

// Helper function to get LangChain Cohere model with validation
export function getCohereChatModel(): ChatCohere {
  if (!validateCohereApiKey()) {
    throw new Error('Cohere API key is not configured');
  }
  return cohereChatModel;
}
