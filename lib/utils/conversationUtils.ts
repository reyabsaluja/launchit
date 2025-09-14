// Conversation utility functions
import { ConversationMessage } from '../types/conversation';

// Helper function to count tokens (rough estimation)
export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Enhanced convergence detection with sentiment analysis
export function detectConvergence(conversation: ConversationMessage[], threshold: number): boolean {
  if (conversation.length < 6) return false;
  
  // Get last few messages for analysis
  const recentMessages = conversation.slice(-6);
  
  // Check for actual consensus patterns, not just keywords
  const consensusPatterns = analyzeConsensusPatterns(recentMessages);
  const sentimentScore = analyzeSentiment(recentMessages);
  
  // Require both pattern matching and positive sentiment
  return consensusPatterns >= threshold && sentimentScore > 0.6;
}

function analyzeConsensusPatterns(messages: ConversationMessage[]): number {
  let consensusScore = 0;
  const totalMessages = messages.length;
  
  for (const message of messages) {
    const content = message.content.toLowerCase();
    
    // Strong consensus indicators (full agreement)
    const strongConsensus = [
      /\b(fully agree|completely agree|totally agree)\b/,
      /\b(perfect|excellent|great plan|sounds good)\b/,
      /\b(let's go with|let's proceed|ready to move forward)\b/,
      /\b(consensus reached|we're aligned|all set)\b/
    ];
    
    // Weak consensus indicators (partial agreement with concerns)
    const weakConsensus = [
      /\bagree.*but\b/,
      /\bgood.*however\b/,
      /\byes.*concern\b/,
      /\blike.*issue\b/
    ];
    
    // Disagreement indicators
    const disagreement = [
      /\b(disagree|don't think|not sure|concerned about)\b/,
      /\b(problem with|issue with|worry about)\b/,
      /\b(need to reconsider|think again|rethink)\b/
    ];
    
    // Score the message
    if (strongConsensus.some(pattern => pattern.test(content))) {
      consensusScore += 1.0;
    } else if (weakConsensus.some(pattern => pattern.test(content))) {
      consensusScore += 0.3; // Partial agreement doesn't count much
    } else if (disagreement.some(pattern => pattern.test(content))) {
      consensusScore -= 0.5;
    }
  }
  
  return Math.max(0, consensusScore / totalMessages);
}

function analyzeSentiment(messages: ConversationMessage[]): number {
  let positiveScore = 0;
  let totalScore = 0;
  
  for (const message of messages) {
    const content = message.content.toLowerCase();
    
    // Positive sentiment indicators
    const positiveWords = [
      'great', 'excellent', 'perfect', 'good', 'nice', 'awesome',
      'love', 'like', 'fantastic', 'wonderful', 'amazing'
    ];
    
    // Negative sentiment indicators
    const negativeWords = [
      'bad', 'terrible', 'awful', 'hate', 'dislike', 'wrong',
      'problem', 'issue', 'concern', 'worry', 'difficult'
    ];
    
    const words = content.split(/\s+/);
    let messageScore = 0;
    
    for (const word of words) {
      if (positiveWords.includes(word)) messageScore += 1;
      if (negativeWords.includes(word)) messageScore -= 1;
    }
    
    positiveScore += Math.max(0, messageScore);
    totalScore += Math.abs(messageScore);
  }
  
  return totalScore > 0 ? positiveScore / totalScore : 0.5;
}

// Generate conversation context for each agent
export function buildConversationContext(
  conversation: ConversationMessage[], 
  currentAgentId: string,
  projectBrief: any
): string {
  if (conversation.length === 0) {
    return `We're starting a planning session for ${projectBrief.companyName}. Based on the project brief, what's your initial assessment and recommendations?`;
  }

  const previousMessages = conversation
    .slice(-3) // Get last 3 messages for context
    .map(msg => `${msg.agentName} (${msg.role}): ${msg.content}`)
    .join('\n\n');

  return `Previous discussion:
${previousMessages}

As the current agent, please provide your perspective on the discussion above and contribute your expertise to the ${projectBrief.companyName} project planning.`;
}
