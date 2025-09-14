// Conversation limits and termination logic
export interface ConversationLimits {
  maxMessages: number;
  maxTokens: number;
  maxDurationMs: number;
  maxRounds: number;
  convergenceThreshold: number;
}

// Default conversation limits
export const DEFAULT_LIMITS: ConversationLimits = {
  maxMessages: 10,
  maxTokens: 50000,
  maxDurationMs: 60000, // 1 minute
  maxRounds: 3,
  convergenceThreshold: 0.8
};

export type TerminationReason = 'completed' | 'max_messages' | 'max_tokens' | 'timeout' | 'convergence' | 'max_rounds';

export interface TerminationCheck {
  shouldTerminate: boolean;
  reason?: TerminationReason;
}

// Check if conversation should terminate based on limits
export function checkTerminationConditions(
  messageCount: number,
  totalTokens: number,
  startTime: number,
  limits: ConversationLimits
): TerminationCheck {
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;

  if (messageCount >= limits.maxMessages) {
    return { shouldTerminate: true, reason: 'max_messages' };
  }

  if (totalTokens >= limits.maxTokens) {
    return { shouldTerminate: true, reason: 'max_tokens' };
  }

  if (elapsed >= limits.maxDurationMs) {
    return { shouldTerminate: true, reason: 'timeout' };
  }

  return { shouldTerminate: false };
}
