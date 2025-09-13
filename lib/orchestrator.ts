import { createAllAgents, getConversationOrder, getAgentConfig } from './agentFactory';
import agentsConfig from '../agents.json';

// Types for conversation and artifacts
export interface ConversationMessage {
  id: string;
  agentId: string;
  agentName: string;
  role: string;
  content: string;
  timestamp: Date;
  hasArtifact: boolean;
  artifactType?: string;
}

export interface Artifact {
  id: string;
  type: string;
  title: string;
  content: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
}

export interface ConversationResult {
  conversation: ConversationMessage[];
  artifacts: Record<string, Artifact>;
  summary: {
    totalMessages: number;
    totalArtifacts: number;
    participatingAgents: string[];
    duration: number;
  };
}

export interface ProjectBrief {
  companyName: string;
  industry: string;
  problemStatement: string;
  targetUsers: string;
  timeline: string;
  budget: string;
  additionalContext?: string;
}

// Helper function to detect if a message contains an artifact
function detectArtifact(content: string): { hasArtifact: boolean; type?: string } {
  const triggerPhrases = agentsConfig.global_settings.deliverable_trigger_phrases;
  const contentLower = content.toLowerCase();
  
  // Check for trigger phrases
  const hasArtifact = triggerPhrases.some(phrase => 
    contentLower.includes(phrase.toLowerCase())
  );

  // Also detect artifacts based on content structure and length
  const hasStructuredContent = (
    content.includes('#') || 
    content.includes('**') || 
    content.includes('##') ||
    content.length > 500 // Long responses likely contain deliverables
  );

  if (!hasArtifact && !hasStructuredContent) {
    return { hasArtifact: false };
  }

  // Detect artifact type based on content and agent role
  if (contentLower.includes('prd') || contentLower.includes('product requirements') || contentLower.includes('problem statement')) {
    return { hasArtifact: true, type: 'PRD' };
  }
  if (contentLower.includes('timeline') || contentLower.includes('schedule') || contentLower.includes('milestone') || contentLower.includes('week')) {
    return { hasArtifact: true, type: 'Timeline' };
  }
  if (contentLower.includes('architecture') || contentLower.includes('technical') || contentLower.includes('engineering') || contentLower.includes('tech stack')) {
    return { hasArtifact: true, type: 'Engineering' };
  }
  if (contentLower.includes('marketing') || contentLower.includes('brand') || contentLower.includes('copy') || contentLower.includes('campaign')) {
    return { hasArtifact: true, type: 'Marketing' };
  }

  return { hasArtifact: true, type: 'Document' };
}

// Helper function to extract artifact content from agent response
function extractArtifactContent(agentResponse: string): string {
  // Look for structured content that represents a deliverable
  const lines = agentResponse.split('\n');
  let artifactStart = -1;
  
  // Find where the artifact content begins
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('# ') || line.includes('## ') || 
        line.includes('**') || line.includes('---')) {
      artifactStart = i;
      break;
    }
  }
  
  if (artifactStart >= 0) {
    return lines.slice(artifactStart).join('\n').trim();
  }
  
  // If no structured content found, return the full response
  return agentResponse;
}

// Generate conversation context for each agent
function buildConversationContext(
  conversation: ConversationMessage[], 
  currentAgentId: string,
  projectBrief: ProjectBrief
): string {
  if (conversation.length === 0) {
    return `We're starting a planning session for ${projectBrief.companyName}. Based on the project brief, what's your initial assessment and recommendations?`;
  }

  const previousMessages = conversation
    .slice(-3) // Get last 3 messages for context
    .map(msg => `${msg.agentName} (${msg.role}): ${msg.content}`)
    .join('\n\n');

  const agentConfig = getAgentConfig(currentAgentId);
  
  return `Previous discussion:
${previousMessages}

As the ${agentConfig.role}, please provide your perspective on the discussion above and contribute your expertise to the ${projectBrief.companyName} project planning.`;
}

// Main orchestrator function
export async function runConversation(projectBrief: ProjectBrief): Promise<ConversationResult> {
  const startTime = Date.now();
  const conversation: ConversationMessage[] = [];
  const artifacts: Record<string, Artifact> = {};
  
  try {
    // Create all agents
    const agents = createAllAgents(projectBrief);
    const conversationOrder = getConversationOrder();
    
    console.log(`Starting conversation with ${conversationOrder.length} agents...`);
    
    // Run agents in sequence
    for (let i = 0; i < conversationOrder.length; i++) {
      const agentId = conversationOrder[i];
      const agent = agents[agentId];
      const agentConfig = getAgentConfig(agentId);
      
      console.log(`Running agent: ${agentConfig.name} (${agentConfig.role})`);
      
      // Build context for this agent
      const input = buildConversationContext(conversation, agentId, projectBrief);
      
      try {
        // Get agent response
        const response = await agent.call({ input });
        const content = response.text || response.response || response;
        
        // Detect if response contains an artifact
        const artifactInfo = detectArtifact(content);
        
        // Create conversation message
        const messageId = `msg_${Date.now()}_${i}`;
        const message: ConversationMessage = {
          id: messageId,
          agentId,
          agentName: agentConfig.name,
          role: agentConfig.role,
          content,
          timestamp: new Date(),
          hasArtifact: artifactInfo.hasArtifact,
          artifactType: artifactInfo.type
        };
        
        conversation.push(message);
        
        // Extract and store artifact if present
        if (artifactInfo.hasArtifact) {
          const artifactId = `artifact_${agentId}_${Date.now()}`;
          const artifactContent = extractArtifactContent(content);
          
          const artifact: Artifact = {
            id: artifactId,
            type: artifactInfo.type || 'Document',
            title: `${artifactInfo.type || 'Document'} by ${agentConfig.name}`,
            content: artifactContent,
            agentId,
            agentName: agentConfig.name,
            timestamp: new Date()
          };
          
          artifacts[artifactId] = artifact;
          console.log(`Created artifact: ${artifact.title}`);
        }
        
        console.log(`✓ ${agentConfig.name} contributed to the conversation`);
        
      } catch (error) {
        console.error(`Error with agent ${agentConfig.name}:`, error);
        
        // Add error message to conversation
        const errorMessage: ConversationMessage = {
          id: `error_${Date.now()}_${i}`,
          agentId,
          agentName: agentConfig.name,
          role: agentConfig.role,
          content: `[Error: Unable to generate response. ${error instanceof Error ? error.message : 'Unknown error'}]`,
          timestamp: new Date(),
          hasArtifact: false
        };
        
        conversation.push(errorMessage);
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Build summary
    const summary = {
      totalMessages: conversation.length,
      totalArtifacts: Object.keys(artifacts).length,
      participatingAgents: [...new Set(conversation.map(msg => msg.agentName))],
      duration
    };
    
    console.log(`Conversation completed in ${duration}ms`);
    console.log(`Generated ${summary.totalMessages} messages and ${summary.totalArtifacts} artifacts`);
    
    return {
      conversation,
      artifacts,
      summary
    };
    
  } catch (error) {
    console.error('Error in conversation orchestrator:', error);
    throw new Error(`Conversation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to get artifacts by type
export function getArtifactsByType(artifacts: Record<string, Artifact>, type: string): Artifact[] {
  return Object.values(artifacts).filter(artifact => artifact.type === type);
}

// Helper function to get conversation by agent
export function getMessagesByAgent(conversation: ConversationMessage[], agentId: string): ConversationMessage[] {
  return conversation.filter(msg => msg.agentId === agentId);
}

// Export conversation to markdown format
export function exportConversationToMarkdown(result: ConversationResult, projectBrief: ProjectBrief): string {
  const { conversation, artifacts, summary } = result;
  
  let markdown = `# ${projectBrief.companyName} - Startup Planning Session\n\n`;
  markdown += `**Generated on:** ${new Date().toISOString()}\n`;
  markdown += `**Duration:** ${summary.duration}ms\n`;
  markdown += `**Participants:** ${summary.participatingAgents.join(', ')}\n\n`;
  
  markdown += `## Project Brief\n\n`;
  markdown += `- **Company:** ${projectBrief.companyName}\n`;
  markdown += `- **Industry:** ${projectBrief.industry}\n`;
  markdown += `- **Problem:** ${projectBrief.problemStatement}\n`;
  markdown += `- **Target Users:** ${projectBrief.targetUsers}\n`;
  markdown += `- **Timeline:** ${projectBrief.timeline}\n`;
  markdown += `- **Budget:** ${projectBrief.budget}\n\n`;
  
  markdown += `## Conversation\n\n`;
  conversation.forEach(msg => {
    markdown += `### ${msg.agentName} (${msg.role})\n`;
    markdown += `${msg.content}\n\n`;
    if (msg.hasArtifact) {
      markdown += `*📄 Generated ${msg.artifactType}*\n\n`;
    }
    markdown += `---\n\n`;
  });
  
  markdown += `## Artifacts\n\n`;
  Object.values(artifacts).forEach(artifact => {
    markdown += `### ${artifact.title}\n\n`;
    markdown += `**Type:** ${artifact.type}\n`;
    markdown += `**Author:** ${artifact.agentName}\n\n`;
    markdown += `${artifact.content}\n\n`;
    markdown += `---\n\n`;
  });
  
  return markdown;
}
