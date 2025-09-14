// Artifact detection and extraction utilities
import agentsConfig from '../../agents.json';

export interface ArtifactInfo {
  hasArtifact: boolean;
  type?: string;
}

// Helper function to detect if a message contains an artifact
export function detectArtifact(content: string): ArtifactInfo {
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
  const artifactType = determineArtifactType(contentLower);
  return { hasArtifact: true, type: artifactType };
}

function determineArtifactType(contentLower: string): string {
  if (contentLower.includes('prd') || contentLower.includes('product requirements') || contentLower.includes('problem statement')) {
    return 'PRD';
  }
  if (contentLower.includes('timeline') || contentLower.includes('schedule') || contentLower.includes('milestone') || contentLower.includes('week')) {
    return 'Timeline';
  }
  if (contentLower.includes('architecture') || contentLower.includes('technical') || contentLower.includes('engineering') || contentLower.includes('tech stack')) {
    return 'Engineering';
  }
  if (contentLower.includes('marketing') || contentLower.includes('brand') || contentLower.includes('copy') || contentLower.includes('campaign')) {
    return 'Marketing';
  }
  return 'Document';
}

// Helper function to extract artifact content from agent response
export function extractArtifactContent(agentResponse: string): string {
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
