import { ChatPromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';
import { getCohereChatModel } from './cohere';
import agentsConfig from '../agents.json';

// Enhanced types for agentic conversation
export interface AgentMessage {
  id: string;
  agentId: string;
  agentName: string;
  role: string;
  content: string;
  timestamp: Date;
  messageType: 'discussion' | 'deliverable' | 'question' | 'response' | 'summary';
  replyTo?: string;
  artifacts?: string[];
}

export interface AgentState {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
  lastMessage?: AgentMessage;
  deliverables: string[];
}

export interface ConversationContext {
  projectBrief: ProjectBrief;
  messages: AgentMessage[];
  currentTopic: string;
  phase: 'initial_discussion' | 'deep_dive' | 'consolidation' | 'finalization';
  artifacts: Record<string, Artifact>;
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

export interface Artifact {
  id: string;
  type: string;
  title: string;
  content: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
  version: number;
}

export interface AgenticConversationResult {
  messages: AgentMessage[];
  artifacts: Record<string, Artifact>;
  summary: {
    totalMessages: number;
    totalArtifacts: number;
    participatingAgents: string[];
    duration: number;
    phases: string[];
    terminationReason: 'completed' | 'max_messages' | 'max_tokens' | 'timeout' | 'convergence' | 'max_rounds';
    totalTokens: number;
    rounds: number;
  };
  pmSummary: string;
}

// Agent configuration interface
interface AgentConfig {
  id: string;
  name: string;
  role: string;
  personality: string;
  tone: string;
  deliverables: Array<{
    type: string;
    title: string;
    description: string;
  }>;
  expertise: string[];
  communication_style: {
    opening_phrases: string[];
    concerns: string[];
  };
}

// Enhanced agent class for agentic behavior
class AgenticAgent {
  private agent: LLMChain;
  private config: AgentConfig;
  private context: ConversationContext;
  
  constructor(agentId: string, projectBrief: ProjectBrief) {
    this.config = agentsConfig.agents[agentId as keyof typeof agentsConfig.agents] as AgentConfig;
    this.context = {
      projectBrief,
      messages: [],
      currentTopic: 'project_planning',
      phase: 'initial_discussion',
      artifacts: {}
    };
    
    this.agent = this.createAgent();
  }
  
  private createAgent(): LLMChain {
    const systemPrompt = this.generateSystemPrompt();
    
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
  
  private generateSystemPrompt(): string {
    return `You are ${this.config.name}, a ${this.config.role} in a REAL collaborative startup planning session for ${this.context.projectBrief.companyName}.

CHARACTER:
- Personality: ${this.config.personality}
- Tone: ${this.config.tone}
- Expertise: ${this.config.expertise.join(', ')}
- Key Concerns: ${this.config.communication_style.concerns.join(', ')}

PROJECT DETAILS:
- Industry: ${this.context.projectBrief.industry}
- Problem: ${this.context.projectBrief.problemStatement}
- Target Users: ${this.context.projectBrief.targetUsers}
- Timeline: ${this.context.projectBrief.timeline}
- Budget: ${this.context.projectBrief.budget}
${this.context.projectBrief.additionalContext ? `- Context: ${this.context.projectBrief.additionalContext}` : ''}

YOUR ROLE:
${this.config.deliverables.map(d => `- ${d.title}: ${d.description}`).join('\n')}

CRITICAL INSTRUCTIONS:
1. READ AND RESPOND to what others actually say - this is a real conversation
2. BUILD ON previous messages - reference specific points made by teammates
3. ASK QUESTIONS when you need clarification or disagree
4. CHALLENGE ideas constructively when they conflict with your expertise
5. CREATE detailed deliverables when the conversation calls for them
6. USE your opening phrases naturally: "${this.config.communication_style.opening_phrases.join('", "')}"

You are NOT following a script. Respond authentically based on:
- What was just said by your teammate
- Your professional expertise and concerns
- The specific project details above
- The natural flow of conversation

Be direct, professional, and add real value to the discussion.`;
  }
  
  public updateContext(context: ConversationContext): void {
    this.context = { ...context };
  }
  
  public async generateResponse(input: string, conversationHistory: AgentMessage[]): Promise<string> {
    console.log(`🤖 ${this.config.name} generating response...`);
    
    // Build rich conversation context
    const recentMessages = conversationHistory.slice(-4).map(msg => 
      `${msg.agentName}: ${msg.content}`
    ).join('\n\n');
    
    const contextualPrompt = `${this.generateSystemPrompt()}

RECENT CONVERSATION:
${recentMessages}

LATEST MESSAGE TO RESPOND TO:
${input}

Your response (be natural, specific, and add real value. Keep it concise - max 300 words):`;
    
    console.log(`📝 Prompt length: ${contextualPrompt.length} characters`);
    
    try {
      console.log(`🔄 Calling LLM for ${this.config.name}...`);
      const response = await this.agent.call({ input: contextualPrompt });
      console.log(`✅ LLM response received for ${this.config.name}`);
      
      const content = response.text || response.response || response || 'No response generated';
      console.log(`📤 Final response (${content.length} chars): ${content.substring(0, 100)}...`);
      
      return content;
    } catch (error) {
      console.error(`❌ Error generating response for ${this.config.name}:`, error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }
  
  public async shouldRespond(lastMessage: AgentMessage, conversationHistory: AgentMessage[]): Promise<boolean> {
    // Use LLM to determine if this agent should respond
    const shouldRespondPrompt = `Should ${this.config.name} (${this.config.role}) respond to this message?

Message: "${lastMessage.content}"
From: ${lastMessage.agentName}

Your expertise: ${this.config.expertise.join(', ')}
Your concerns: ${this.config.communication_style.concerns.join(', ')}

Recent speakers: ${conversationHistory.slice(-2).map(msg => msg.agentName).join(', ')}

Answer YES only if:
- This directly relates to your expertise (${this.config.expertise.join('/')})
- You were mentioned or asked a question
- You strongly disagree and need to clarify
- You have critical insights to add

Answer NO if:
- You just spoke in the last 2 messages
- Someone else can better address this
- The point doesn't need your input

Just answer: YES or NO`;

    try {
      const response = await this.agent.call({ input: shouldRespondPrompt });
      const decision = (response.text || response.response || response).trim().toUpperCase();
      return decision.startsWith('YES') || decision.includes('YES');
    } catch (error) {
      console.error('Error in shouldRespond:', error);
      // Fallback: only respond if directly mentioned or highly relevant
      const isDirectlyMentioned = lastMessage.content.toLowerCase().includes(this.config.name.toLowerCase()) ||
                                 lastMessage.content.toLowerCase().includes(this.config.role.toLowerCase());
      const isHighlyRelevant = this.config.expertise.some(expertise => 
        lastMessage.content.toLowerCase().includes(expertise.toLowerCase())
      ) && !conversationHistory.slice(-2).some(msg => msg.agentId === this.config.id);
      return isDirectlyMentioned || isHighlyRelevant;
    }
  }
  
  public getConfig(): AgentConfig {
    return this.config;
  }
}

// Configuration for conversation limits
interface ConversationLimits {
  maxTotalMessages: number;
  maxTokens: number;
  maxDurationMs: number;
  maxRoundsPerPhase: number;
  convergenceThreshold: number;
}

// Enhanced orchestrator for agentic conversations
export class AgenticOrchestrator {
  private agents: Map<string, AgenticAgent> = new Map();
  private context: ConversationContext;
  private messageCallbacks: Array<(message: AgentMessage) => void> = [];
  private limits: ConversationLimits;
  private startTime: number = 0;
  private totalTokens: number = 0;
  
  constructor(projectBrief: ProjectBrief, onMessage?: (message: AgentMessage) => void, limits?: Partial<ConversationLimits>) {
    this.context = {
      projectBrief,
      messages: [],
      currentTopic: 'project_planning',
      phase: 'initial_discussion',
      artifacts: {}
    };
    
    // Set default limits with user overrides
    this.limits = {
      maxTotalMessages: 20,
      maxTokens: 15000,
      maxDurationMs: 5 * 60 * 1000, // 5 minutes
      maxRoundsPerPhase: 4,
      convergenceThreshold: 3,
      ...limits
    };
    
    if (onMessage) {
      this.onMessage(onMessage);
    }
    
    this.initializeAgents();
  }
  
  private initializeAgents(): void {
    const agentIds = Object.keys(agentsConfig.agents);
    
    for (const agentId of agentIds) {
      const agent = new AgenticAgent(agentId, this.context.projectBrief);
      this.agents.set(agentId, agent);
    }
  }
  
  public onMessage(callback: (message: AgentMessage) => void): void {
    this.messageCallbacks.push(callback);
  }
  
  private emitMessage(message: AgentMessage): void {
    this.messageCallbacks.forEach(callback => callback(message));
  }
  
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private shouldTerminate(): boolean {
    const currentTime = Date.now();
    const elapsed = currentTime - this.startTime;
    
    // Check time limit
    if (elapsed > this.limits.maxDurationMs) {
      console.log('⏰ Time limit exceeded, terminating conversation');
      return true;
    }
    
    // Check message limit
    if (this.context.messages.length >= this.limits.maxTotalMessages) {
      console.log('📝 Message limit exceeded, terminating conversation');
      return true;
    }
    
    // Check token limit
    if (this.totalTokens >= this.limits.maxTokens) {
      console.log('🔤 Token limit exceeded, terminating conversation');
      return true;
    }
    
    return false;
  }
  
  private detectConvergence(response: string): boolean {
    const convergenceKeywords = [
      'i agree', 'agreed', 'consensus', 'we\'re aligned', 'sounds good',
      'that works', 'perfect', 'exactly', 'yes, that\'s right',
      'i think we have', 'we\'ve covered', 'that covers it',
      'we\'re on the same page', 'that sums it up', 'good summary'
    ];
    
    const disagreementKeywords = [
      'however', 'but', 'although', 'disagree', 'concern', 'issue',
      'problem', 'wait', 'actually', 'not sure', 'question'
    ];
    
    const responseLower = response.toLowerCase();
    
    // Check for disagreement first - if found, no convergence
    const hasDisagreement = disagreementKeywords.some(keyword => 
      responseLower.includes(keyword)
    );
    
    if (hasDisagreement) {
      return false;
    }
    
    // Check for convergence keywords
    const hasConvergence = convergenceKeywords.some(keyword => 
      responseLower.includes(keyword)
    );
    
    // Additional heuristic: short responses often indicate agreement
    const isShortAgreement = response.length < 200 && hasConvergence;
    
    return hasConvergence || isShortAgreement;
  }
  
  public async startConversation(): Promise<AgenticConversationResult> {
    this.startTime = Date.now();
    
    try {
      console.log('🚀 Starting conversation phases...');
      
      // Run the multi-phase conversation
      console.log('📋 Phase 1: Initial Discussion');
      await this.runInitialDiscussion();
      console.log(`✅ Initial discussion complete. Messages so far: ${this.context.messages.length}`);
      
      // Skip deep dive and consolidation if we're close to limits
      if (this.context.messages.length < this.limits.maxTotalMessages - 8) {
        console.log('🔍 Phase 2: Deep Dive');
        await this.runDeepDive();
        console.log(`✅ Deep dive complete. Messages so far: ${this.context.messages.length}`);
      }
      
      if (this.context.messages.length < this.limits.maxTotalMessages - 4) {
        console.log('🎯 Phase 3: Consolidation');
        await this.runConsolidation();
        console.log(`✅ Consolidation complete. Messages so far: ${this.context.messages.length}`);
      }
      
      console.log('📝 Phase 4: Final Summary');
      // Skip PM summary for now - focus on getting basic conversation working
      console.log(`✅ All phases complete. Final message count: ${this.context.messages.length}`);
      
      const endTime = Date.now();
      const duration = endTime - this.startTime;
      
      // Determine termination reason
      let terminationReason: 'completed' | 'max_messages' | 'max_tokens' | 'timeout' | 'convergence' | 'max_rounds' = 'completed';
      
      if (this.context.messages.length >= this.limits.maxTotalMessages) {
        terminationReason = 'max_messages';
      } else if (this.totalTokens >= this.limits.maxTokens) {
        terminationReason = 'max_tokens';
      } else if (duration > this.limits.maxDurationMs) {
        terminationReason = 'timeout';
      }
      
      // Generate final summary
      const summary = {
        totalMessages: this.context.messages.length,
        totalArtifacts: Object.keys(this.context.artifacts).length,
        participatingAgents: [...new Set(this.context.messages.map(msg => msg.agentId))],
        duration,
        phases: ['initial_discussion', 'deep_dive', 'consolidation', 'pm_summary'],
        terminationReason,
        totalTokens: this.totalTokens,
        rounds: 1
      };
      
      console.log('🎉 Conversation completed successfully!');
      console.log('Final summary:', summary);
      
      return {
        messages: this.context.messages,
        artifacts: this.context.artifacts,
        summary,
        pmSummary: this.context.messages.find(msg => msg.messageType === 'summary')?.content || ''
      };
    } catch (error) {
      console.error('❌ Error in startConversation:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }
  
  private async runInitialDiscussion(): Promise<void> {
    this.context.phase = 'initial_discussion';
    
    // Start with Product Manager's initial assessment based on actual project brief
    const pmAgent = this.agents.get('product_manager')!;
    const initialPrompt = `We're starting a planning session for ${this.context.projectBrief.companyName}.

Project Details:
- Industry: ${this.context.projectBrief.industry}
- Problem: ${this.context.projectBrief.problemStatement}
- Target Users: ${this.context.projectBrief.targetUsers}
- Timeline: ${this.context.projectBrief.timeline}
- Budget: ${this.context.projectBrief.budget}
${this.context.projectBrief.additionalContext ? `- Additional Context: ${this.context.projectBrief.additionalContext}` : ''}

As the Product Manager, provide your initial assessment in 2-3 concise paragraphs. What should we prioritize for the MVP? What are the key user needs and market opportunities you see?`;
    
    try {
      console.log('🎯 PM Agent generating initial response...');
      const pmResponse = await pmAgent.generateResponse(initialPrompt, []);
      console.log('✅ PM Response received:', pmResponse.substring(0, 100) + '...');
      
      const pmMessage = this.createMessage('product_manager', pmResponse, 'discussion');
      this.addMessage(pmMessage);
      console.log('📝 PM message added to conversation');
      
      // Let other agents respond naturally to the PM's assessment
      console.log('🤝 Starting discussion facilitation...');
      await this.facilitateDiscussion(4); // Increased to allow proper progression
      console.log('✅ Discussion facilitation complete');
    } catch (error) {
      console.error('❌ Error in initial discussion:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }
  
  private async runDeepDive(): Promise<void> {
    this.context.phase = 'deep_dive';
    
    // Analyze the discussion so far and prompt for specific deliverables
    const recentDiscussion = this.context.messages.slice(-5).map(msg => 
      `${msg.agentName}: ${msg.content}`
    ).join('\n\n');
    
    const deepDivePrompt = `Based on our initial discussion:\n\n${recentDiscussion}\n\nNow let's create concise deliverables (max 200 words each):\n\n- Product Manager: Create a brief PRD with key user stories\n- Senior Engineer: Design core technical architecture\n- Project Manager: Build a realistic timeline with milestones\n- Marketing Lead: Develop go-to-market strategy\n\nKeep responses focused and actionable.`;
    
    const facilitatorMessage = this.createMessage('facilitator', deepDivePrompt, 'discussion');
    this.addMessage(facilitatorMessage);
    
    await this.facilitateDiscussion(4); // Increased to allow proper progression
  }
  
  private async runConsolidation(): Promise<void> {
    this.context.phase = 'consolidation';
    
    // Summarize key decisions and artifacts created so far
    const keyDecisions = this.context.messages
      .filter(msg => msg.content.length > 200)
      .slice(-6)
      .map(msg => `${msg.agentName}: ${msg.content.substring(0, 200)}`)
      .join('\n\n');
    
    const consolidationPrompt = `Let's consolidate our startup plan. Here are the key points discussed:\n\n${keyDecisions}\n\nNow let's finalize everything:\n1. Review and refine your deliverables\n2. Identify any gaps or conflicts\n3. Ensure all components work together\n4. Address any remaining concerns\n\nMake sure our plan is cohesive and actionable.`;
    
    const facilitatorMessage = this.createMessage('facilitator', consolidationPrompt, 'discussion');
    this.addMessage(facilitatorMessage);
    
    await this.facilitateDiscussion(4); // Increased to allow proper progression
  }
  
  private async facilitateDiscussion(maxRounds: number): Promise<void> {
    let rounds = 0;
    let consecutiveNoResponses = 0;
    let convergenceCount = 0;
    
    while (rounds < Math.min(maxRounds, this.limits.maxRoundsPerPhase) && 
           consecutiveNoResponses < 2 && 
           !this.shouldTerminate()) {
      const lastMessage = this.context.messages[this.context.messages.length - 1];
      let someoneResponded = false;
      
      // Get all agents who want to respond
      const interestedAgents: string[] = [];
      
      for (const [agentId, agent] of this.agents) {
        if (agentId === lastMessage?.agentId) continue; // Don't let same agent respond twice in a row
        
        const shouldRespond = await agent.shouldRespond(lastMessage, this.context.messages);
        if (shouldRespond) {
          interestedAgents.push(agentId);
        }
      }
      
      // If multiple agents want to respond, pick one intelligently
      if (interestedAgents.length > 0) {
        // Prioritize agents who haven't spoken recently
        const recentSpeakers = this.context.messages.slice(-2).map(msg => msg.agentId);
        const nonRecentSpeakers = interestedAgents.filter(id => !recentSpeakers.includes(id));
        
        // If we have non-recent speakers, pick randomly from them
        // Otherwise, pick the most relevant agent from interested ones
        let chosenAgentId: string;
        if (nonRecentSpeakers.length > 0) {
          chosenAgentId = nonRecentSpeakers[Math.floor(Math.random() * nonRecentSpeakers.length)];
        } else {
          // Find most relevant among interested agents
          const relevantAgent = this.findMostRelevantAgent(lastMessage);
          chosenAgentId = relevantAgent && interestedAgents.includes(relevantAgent.getConfig().id) 
            ? relevantAgent.getConfig().id 
            : interestedAgents[0];
        }
        
        const chosenAgent = this.agents.get(chosenAgentId)!;
        
        await this.sleep(1500); // Simulate thinking time
        
        try {
          const response = await chosenAgent.generateResponse(
            lastMessage.content, 
            this.context.messages
          );
          
          const message = this.createMessage(chosenAgentId, response, 'discussion');
          this.addMessage(message);
          
          // Update token count
          this.totalTokens += Math.ceil(response.length / 4);
          
          // Check for convergence
          if (this.detectConvergence(response)) {
            convergenceCount++;
            console.log(`🎯 Convergence detected (${convergenceCount}/${this.limits.convergenceThreshold})`);
            if (convergenceCount >= this.limits.convergenceThreshold) {
              console.log('✅ Conversation converged, ending discussion phase');
              break;
            }
          } else {
            convergenceCount = 0;
          }
          
          // Check for artifacts in the response
          await this.extractArtifacts(message);
          
          someoneResponded = true;
          consecutiveNoResponses = 0;
        } catch (error) {
          console.error(`Error getting response from ${chosenAgentId}:`, error);
        }
      }
      
      if (!someoneResponded) {
        consecutiveNoResponses++;
        // If no one wants to respond, end this discussion phase
        console.log(`No agents responded in round ${rounds}, ending discussion phase`);
      }
      
      rounds++;
    }
  }
  
  private findMostRelevantAgent(message: AgentMessage): AgenticAgent | null {
    let bestMatch: AgenticAgent | null = null;
    let bestScore = 0;
    
    for (const [agentId, agent] of this.agents) {
      const config = agent.getConfig();
      let score = 0;
      
      // Check expertise relevance
      for (const expertise of config.expertise) {
        if (message.content.toLowerCase().includes(expertise.toLowerCase())) {
          score += 2;
        }
      }
      
      // Check concern relevance
      for (const concern of config.communication_style.concerns) {
        if (message.content.toLowerCase().includes(concern.toLowerCase())) {
          score += 1;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = agent;
      }
    }
    
    return bestMatch;
  }
  
  private async generatePMSummary(): Promise<string> {
    this.context.phase = 'finalization';
    
    const pmAgent = this.agents.get('product_manager')!;
    
    // Create a comprehensive context of the entire session
    const fullConversation = this.context.messages
      .map(msg => `${msg.agentName} (${msg.role}): ${msg.content}`)
      .join('\n\n');
    
    const artifactSummary = Object.values(this.context.artifacts)
      .map(artifact => `${artifact.type}: ${artifact.title}`)
      .join(', ');
    
    const summaryPrompt = `As the Product Manager, provide a comprehensive executive summary of our ${this.context.projectBrief.companyName} planning session.

Full conversation context:
${fullConversation}

Artifacts created: ${artifactSummary}

Create a detailed summary including:
1. **Executive Summary** - Key insights and decisions
2. **Product Strategy** - Core features and user value proposition
3. **Technical Approach** - Architecture and implementation plan
4. **Go-to-Market** - Launch strategy and marketing approach
5. **Timeline & Milestones** - Key dates and deliverables
6. **Risks & Mitigation** - Potential challenges and solutions
7. **Next Steps** - Immediate actions required

Make this actionable and comprehensive for ${this.context.projectBrief.companyName}.`;
    
    try {
      const summary = await pmAgent.generateResponse(summaryPrompt, this.context.messages);
      
      const summaryMessage = this.createMessage('product_manager', summary, 'summary');
      this.addMessage(summaryMessage);
      
      return summary;
    } catch (error) {
      console.error('Error generating PM summary:', error);
      return 'Error generating summary. Please review the conversation above for key insights.';
    }
  }
  
  private createMessage(
    agentId: string, 
    content: string, 
    messageType: AgentMessage['messageType'],
    replyTo?: string
  ): AgentMessage {
    const agent = this.agents.get(agentId);
    const config = agent?.getConfig();
    
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      agentName: config?.name || agentId,
      role: config?.role || agentId,
      content,
      timestamp: new Date(),
      messageType,
      replyTo,
      artifacts: []
    };
  }
  
  private addMessage(message: AgentMessage): void {
    this.context.messages.push(message);
    
    // Update all agents with new context
    this.agents.forEach(agent => agent.updateContext(this.context));
    
    // Emit message for real-time UI updates
    this.emitMessage(message);
  }
  
  private async extractArtifacts(message: AgentMessage): Promise<void> {
    // Enhanced artifact detection
    const content = message.content;
    const hasStructuredContent = content.includes('#') || content.includes('**') || content.length > 500;
    
    if (hasStructuredContent) {
      const artifactType = this.detectArtifactType(content);
      
      if (artifactType) {
        const artifactId = `artifact_${message.agentId}_${Date.now()}`;
        const artifact: Artifact = {
          id: artifactId,
          type: artifactType,
          title: `${artifactType} by ${message.agentName}`,
          content: this.extractArtifactContent(content),
          agentId: message.agentId,
          agentName: message.agentName,
          timestamp: new Date(),
          version: 1
        };
        
        this.context.artifacts[artifactId] = artifact;
        message.artifacts?.push(artifactId);
      }
    }
  }
  
  private detectArtifactType(content: string): string | null {
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('prd') || contentLower.includes('product requirements')) {
      return 'PRD';
    }
    if (contentLower.includes('timeline') || contentLower.includes('schedule') || contentLower.includes('milestone')) {
      return 'Timeline';
    }
    if (contentLower.includes('architecture') || contentLower.includes('technical') || contentLower.includes('engineering')) {
      return 'Engineering';
    }
    if (contentLower.includes('marketing') || contentLower.includes('brand') || contentLower.includes('copy')) {
      return 'Marketing';
    }
    
    return null;
  }
  
  private extractArtifactContent(content: string): string {
    const lines = content.split('\n');
    let artifactStart = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('# ') || line.includes('## ') || line.includes('**') || line.includes('---')) {
        artifactStart = i;
        break;
      }
    }
    
    if (artifactStart >= 0) {
      return lines.slice(artifactStart).join('\n').trim();
    }
    
    return content;
  }
}

// Helper function to run agentic conversation
export async function runAgenticConversation(
  projectBrief: ProjectBrief,
  onMessage?: (message: AgentMessage) => void,
  limits?: Partial<ConversationLimits>
): Promise<AgenticConversationResult> {
  console.log(`Starting agentic conversation session for ${projectBrief.companyName}`);
  console.log('Project brief:', JSON.stringify(projectBrief, null, 2));
  
  const orchestrator = new AgenticOrchestrator(projectBrief, onMessage, limits);
  
  try {
    console.log('🚀 Starting agentic conversation...');
    console.log('🔧 Orchestrator created, running conversation...');
    
    // Check if Cohere API key is available
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) {
      console.error('❌ COHERE_API_KEY is not set!');
      throw new Error('COHERE_API_KEY environment variable is required');
    }
    console.log('✅ COHERE_API_KEY is configured');
    
    const result = await orchestrator.startConversation();
    console.log('🎉 Conversation completed, result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error in agentic conversation:', error);
    console.error('📋 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}
