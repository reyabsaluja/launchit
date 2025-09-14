import { TerminationReason } from '../utils/conversationLimits';

// Core conversation types and interfaces
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
    terminationReason: TerminationReason;
    totalTokens: number;
    rounds: number;
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

// Re-export from conversationLimits for convenience
export type { ConversationLimits, TerminationReason } from '../utils/conversationLimits';
