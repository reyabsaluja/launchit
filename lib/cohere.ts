import { ChatCohere } from '@langchain/cohere';

let cachedModel: ChatCohere | null = null;

export function validateCohereApiKey(): boolean {
  const apiKey = process.env.COHERE_API_KEY;
  return typeof apiKey === 'string' && apiKey.trim().length > 0;
}

export function getCohereChatModel(): ChatCohere {
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('Cohere API key is not configured');
  }

  if (!cachedModel) {
    cachedModel = new ChatCohere({
      apiKey,
      model: 'command',
      temperature: 0.3,
    });
  }

  return cachedModel;
}


