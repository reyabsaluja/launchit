// Helper functions for conversation management
import { ConversationMessage, Artifact, ConversationResult, ProjectBrief } from '../types/conversation';

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
  markdown += `**Termination Reason:** ${summary.terminationReason}\n`;
  markdown += `**Total Tokens:** ${summary.totalTokens}\n`;
  markdown += `**Rounds Completed:** ${summary.rounds}\n`;
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
