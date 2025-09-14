// Core orchestration logic - clean and focused
import { createAllAgents, getConversationOrder, getAgentConfig } from './agentFactory';
import { estimateTokens, detectConvergence, buildConversationContext } from './utils/conversationUtils';
import { detectArtifact, extractArtifactContent } from './utils/artifactUtils';
import { ConversationLimits, DEFAULT_LIMITS, TerminationReason, checkTerminationConditions } from './utils/conversationLimits';
import { ConversationMessage, Artifact, ConversationResult, ProjectBrief } from './types/conversation';

// Main orchestrator function with limits
export async function runConversation(
  projectBrief: ProjectBrief, 
  limits: ConversationLimits = DEFAULT_LIMITS
): Promise<ConversationResult> {
  const startTime = Date.now();
  const conversation: ConversationMessage[] = [];
  const artifacts: Record<string, Artifact> = {};
  let totalTokens = 0;
  let terminationReason: TerminationReason = 'completed';
  
  try {
    // Create all agents
    const agents = createAllAgents(projectBrief);
    const conversationOrder = getConversationOrder();
    
    console.log(`Starting conversation with ${conversationOrder.length} agents...`);
    console.log(`Limits: ${limits.maxMessages} messages, ${limits.maxTokens} tokens, ${limits.maxDurationMs}ms, ${limits.maxRounds} rounds`);
    
    // Run multiple rounds of conversation
    for (let round = 0; round < limits.maxRounds; round++) {
      console.log(`\n--- Round ${round + 1}/${limits.maxRounds} ---`);
      
      // Run agents in sequence for this round
      for (let i = 0; i < conversationOrder.length; i++) {
        // Check termination conditions before each agent
        const terminationCheck = checkTerminationConditions(
          conversation.length, 
          totalTokens, 
          startTime, 
          limits
        );
        
        if (terminationCheck.shouldTerminate) {
          terminationReason = terminationCheck.reason!;
          console.log(`Terminating: ${terminationReason}`);
          break;
        }
        
        // Check for convergence
        if (detectConvergence(conversation, limits.convergenceThreshold)) {
          terminationReason = 'convergence';
          console.log(`Terminating: Detected convergence`);
          break;
        }

        const agentId = conversationOrder[i];
        const agent = agents[agentId];
        const agentConfig = getAgentConfig(agentId);
        
        console.log(`Running agent: ${agentConfig.name} (${agentConfig.role}) [Round ${round + 1}]`);
      
        // Build context for this agent
        const input = buildConversationContext(conversation, agentId, projectBrief);
        
        try {
          // Get agent response
          const response = await agent.call({ input });
          const content = response.text || response.response || response;
          
          // Count tokens in response
          const responseTokens = estimateTokens(content);
          totalTokens += responseTokens;
          
          console.log(`Agent response: ${responseTokens} tokens (total: ${totalTokens})`);
        
          // Detect if response contains an artifact
          const artifactInfo = detectArtifact(content);
          
          // Create conversation message
          const messageId = `msg_${Date.now()}_${round}_${i}`;
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
            id: `error_${Date.now()}_${round}_${i}`,
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
      
      // Break out of rounds if terminated
      if (terminationReason !== 'completed') {
        break;
      }
    }
    
    // If we completed all rounds without early termination
    if (terminationReason === 'completed') {
      terminationReason = 'max_rounds';
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Build summary with new fields
    const summary = {
      totalMessages: conversation.length,
      totalArtifacts: Object.keys(artifacts).length,
      participatingAgents: [...new Set(conversation.map(msg => msg.agentName))],
      duration,
      terminationReason,
      totalTokens,
      rounds: Math.min(Math.ceil(conversation.length / getConversationOrder().length), limits.maxRounds)
    };
    
    console.log(`Conversation ${terminationReason} in ${duration}ms`);
    console.log(`Generated ${summary.totalMessages} messages, ${summary.totalArtifacts} artifacts, ${totalTokens} tokens`);
    console.log(`Completed ${summary.rounds} rounds`);
    
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
