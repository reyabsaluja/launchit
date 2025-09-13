import { Artifact } from './orchestrator';

export interface ExportOptions {
  filename?: string;
  includeMetadata?: boolean;
}

/**
 * Converts artifacts object to a formatted Markdown string
 */
export function artifactsToMarkdown(
  artifacts: Record<string, Artifact>,
  options: ExportOptions = {}
): string {
  const { includeMetadata = true } = options;
  
  let markdown = `# Startup Kickoff Pack\n\n`;
  
  if (includeMetadata) {
    markdown += `*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n\n`;
  }
  
  markdown += `This document contains all the key deliverables for your startup planning session.\n\n`;
  markdown += `---\n\n`;
  
  // Define the order of artifacts for consistent output
  const artifactOrder = ['PRD', 'Timeline', 'Engineering', 'Marketing'];
  const artifactTitles = {
    'PRD': 'Product Requirements Document',
    'Timeline': 'Project Timeline',
    'Engineering': 'Engineering Plan',
    'Marketing': 'Marketing Strategy'
  };
  
  // Process artifacts in order
  artifactOrder.forEach(type => {
    const artifact = Object.values(artifacts).find(a => 
      a.type === type || 
      (type === 'Engineering' && a.type === 'architecture') ||
      (type === 'Marketing' && (a.type === 'landing_copy' || a.type === 'brand_assets'))
    );
    
    if (artifact) {
      markdown += `## ${artifactTitles[type as keyof typeof artifactTitles]}\n\n`;
      
      if (includeMetadata) {
        markdown += `**Created by:** ${artifact.agentName}  \n`;
        markdown += `**Generated:** ${artifact.timestamp.toLocaleDateString()}  \n\n`;
      }
      
      markdown += `${artifact.content}\n\n`;
      markdown += `---\n\n`;
    } else {
      markdown += `## ${artifactTitles[type as keyof typeof artifactTitles]}\n\n`;
      markdown += `*This deliverable has not been generated yet.*\n\n`;
      markdown += `---\n\n`;
    }
  });
  
  // Add any additional artifacts that don't fit the standard categories
  const processedTypes = new Set(['PRD', 'Timeline', 'Engineering', 'Marketing', 'architecture', 'landing_copy', 'brand_assets']);
  const additionalArtifacts = Object.values(artifacts).filter(a => !processedTypes.has(a.type));
  
  if (additionalArtifacts.length > 0) {
    markdown += `## Additional Deliverables\n\n`;
    additionalArtifacts.forEach(artifact => {
      markdown += `### ${artifact.title}\n\n`;
      if (includeMetadata) {
        markdown += `**Created by:** ${artifact.agentName}  \n`;
        markdown += `**Generated:** ${artifact.timestamp.toLocaleDateString()}  \n\n`;
      }
      markdown += `${artifact.content}\n\n`;
      markdown += `---\n\n`;
    });
  }
  
  markdown += `\n*End of Startup Kickoff Pack*`;
  
  return markdown;
}

/**
 * Triggers a download of the artifacts as a Markdown file
 */
export function downloadArtifactsAsMarkdown(
  artifacts: Record<string, Artifact>,
  options: ExportOptions = {}
): void {
  const { filename = 'Startup-Kickoff-Pack.md' } = options;
  
  // Convert artifacts to markdown
  const markdownContent = artifactsToMarkdown(artifacts, options);
  
  // Create blob and download
  const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  // Create temporary download link
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy artifacts as markdown to clipboard
 */
export async function copyArtifactsToClipboard(
  artifacts: Record<string, Artifact>,
  options: ExportOptions = {}
): Promise<boolean> {
  try {
    const markdownContent = artifactsToMarkdown(artifacts, options);
    await navigator.clipboard.writeText(markdownContent);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Get export statistics
 */
export function getExportStats(artifacts: Record<string, Artifact>) {
  const totalArtifacts = Object.keys(artifacts).length;
  const artifactTypes = [...new Set(Object.values(artifacts).map(a => a.type))];
  const totalWords = Object.values(artifacts)
    .map(a => a.content.split(/\s+/).length)
    .reduce((sum, count) => sum + count, 0);
  
  return {
    totalArtifacts,
    artifactTypes,
    totalWords,
    estimatedReadTime: Math.ceil(totalWords / 200) // Assuming 200 words per minute
  };
}
