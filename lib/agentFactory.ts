import { ChatPromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { getCohereChatModel } from './cohere';
import agentsConfig from '../agents.json';

// Types for agent configuration
interface AgentDeliverable {
  type: string;
  title: string;
  description: string;
}

interface AgentCommunicationStyle {
  opening_phrases: string[];
  concerns: string[];
}

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  personality: string;
  tone: string;
  deliverables: AgentDeliverable[];
  expertise: string[];
  communication_style: AgentCommunicationStyle;
}

interface ProjectBrief {
  companyName: string;
  industry: string;
  problemStatement: string;
  targetUsers: string;
  timeline: string;
  budget: string;
  additionalContext?: string;
}

// Generate system prompt based on agent configuration
function generateSystemPrompt(agent: AgentConfig, projectBrief: ProjectBrief): string {
  const deliverablesList = agent.deliverables
    .map(d => `- ${d.title}: ${d.description}`)
    .join('\n');
  
  const expertiseList = agent.expertise.join(', ');
  
  const openingPhrases = agent.communication_style.opening_phrases.join('", "');
  const concerns = agent.communication_style.concerns.join(', ');

  return `You are ${agent.name}, a ${agent.role} with the following characteristics:

PERSONALITY: ${agent.personality}

COMMUNICATION TONE: ${agent.tone}

EXPERTISE: ${expertiseList}

PROJECT CONTEXT:
- Company: ${projectBrief.companyName}
- Industry: ${projectBrief.industry}
- Problem: ${projectBrief.problemStatement}
- Target Users: ${projectBrief.targetUsers}
- Timeline: ${projectBrief.timeline}
- Budget: ${projectBrief.budget}
${projectBrief.additionalContext ? `- Additional Context: ${projectBrief.additionalContext}` : ''}

YOUR DELIVERABLES:
${deliverablesList}

COMMUNICATION STYLE:
- Use phrases like: "${openingPhrases}"
- Focus on: ${concerns}
- Build on previous contributions while maintaining your unique perspective

IMPORTANT: Always create structured, detailed deliverables using markdown formatting with headers (#, ##), bold text (**text**), and bullet points. Start your response with phrases like "Let me draft", "I'll create", or "Here's the" to ensure your deliverables are properly captured.

Provide valuable insights from your ${agent.role} perspective. Be specific and actionable in your recommendations.`;
}

// Create LangChain agent from configuration
export function createAgent(agentId: string, projectBrief: ProjectBrief): LLMChain {
  const agent = agentsConfig.agents[agentId as keyof typeof agentsConfig.agents] as AgentConfig;
  
  if (!agent) {
    throw new Error(`Agent with ID "${agentId}" not found in configuration`);
  }

  const systemPrompt = generateSystemPrompt(agent, projectBrief);
  
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', systemPrompt],
    ['human', '{input}'],
  ]);

  const llm = getCohereChatModel();
  
  return new LLMChain({
    llm,
    prompt,
  });
}

// Get agent configuration by ID
export function getAgentConfig(agentId: string): AgentConfig {
  const agent = agentsConfig.agents[agentId as keyof typeof agentsConfig.agents] as AgentConfig;
  
  if (!agent) {
    throw new Error(`Agent with ID "${agentId}" not found in configuration`);
  }
  
  return agent;
}

// Get all available agent IDs
export function getAvailableAgents(): string[] {
  return Object.keys(agentsConfig.agents);
}

// Create all agents for a project
export function createAllAgents(projectBrief: ProjectBrief): Record<string, LLMChain> {
  const agents: Record<string, LLMChain> = {};
  
  for (const agentId of getAvailableAgents()) {
    agents[agentId] = createAgent(agentId, projectBrief);
  }
  
  return agents;
}

// Helper to get conversation flow order
export function getConversationOrder(): string[] {
  return agentsConfig.conversation_flow.typical_order;
}

// Example usage function
export async function demonstrateProductManagerAgent(projectBrief: ProjectBrief) {
  try {
    // Create the Product Manager agent
    const pmAgent = createAgent('product_manager', projectBrief);
    
    // Example conversation starter
    const response = await pmAgent.call({
      input: `We're starting the planning session for ${projectBrief.companyName}. Based on the project brief, what's your initial assessment and what should we prioritize for the MVP?`
    });
    
    console.log('Product Manager Response:', response.text);
    return response.text;
    
  } catch (error) {
    console.error('Error creating Product Manager agent:', error);
    throw error;
  }
}
