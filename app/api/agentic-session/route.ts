import { NextRequest, NextResponse } from 'next/server';
import { runAgenticConversation, AgentMessage, AgenticConversationResult } from '@/lib/agenticOrchestrator';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { validateCohereApiKey } from '@/lib/cohere';

// Enhanced session data structure for agentic conversations
interface AgenticSessionData {
  conversationResult: AgenticConversationResult;
  projectBrief: {
    companyName: string;
    industry: string;
    problemStatement: string;
    targetUsers: string;
    keyFeatureIdea?: string;
    timeline: string;
    budget: string;
    additionalContext?: string;
  };
  isComplete: boolean;
  currentPhase: string;
}

// In-memory storage for agentic conversation sessions
const agenticSessions = new Map<string, AgenticSessionData>();

// File-based session storage for persistence
const SESSIONS_DIR = join(process.cwd(), '.sessions');
if (!existsSync(SESSIONS_DIR)) {
  mkdirSync(SESSIONS_DIR, { recursive: true });
}

function saveAgenticSessionToFile(sessionId: string, sessionData: AgenticSessionData) {
  try {
    const filePath = join(SESSIONS_DIR, `agentic_${sessionId}.json`);
    writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
  } catch (error) {
    console.error('Error saving agentic session to file:', error);
  }
}

function loadAgenticSessionFromFile(sessionId: string): AgenticSessionData | undefined {
  try {
    const filePath = join(SESSIONS_DIR, `agentic_${sessionId}.json`);
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading agentic session from file:', error);
  }
  return undefined;
}

// Types for API request/response
interface StartAgenticSessionRequest {
  companyName: string;
  industry: string;
  problemStatement: string;
  targetUsers: string;
  keyFeatureIdea?: string;
  timeline: string;
  budget: string;
  additionalContext?: string;
}

interface StartAgenticSessionResponse {
  success: boolean;
  sessionId?: string;
  data?: {
    messages: AgentMessage[];
    artifacts: Record<string, any>;
    summary: any;
    pmSummary: string;
    projectBrief: any;
    isComplete: boolean;
    currentPhase: string;
  };
  error?: string;
}

// Server-Sent Events for real-time updates
interface SSEClient {
  id: string;
  response: NextResponse;
  controller: ReadableStreamDefaultController;
}

const sseClients = new Map<string, SSEClient[]>();

function addSSEClient(sessionId: string, client: SSEClient) {
  if (!sseClients.has(sessionId)) {
    sseClients.set(sessionId, []);
  }
  sseClients.get(sessionId)!.push(client);
}

function removeSSEClient(sessionId: string, clientId: string) {
  const clients = sseClients.get(sessionId);
  if (clients) {
    const index = clients.findIndex(c => c.id === clientId);
    if (index >= 0) {
      clients.splice(index, 1);
    }
  }
}

function broadcastToSSEClients(sessionId: string, data: any) {
  const clients = sseClients.get(sessionId);
  if (clients) {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    clients.forEach(client => {
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
      } catch (error) {
        console.error('Error sending SSE message:', error);
      }
    });
  }
}

// Validate request body
function validateRequestBody(body: unknown): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!body || typeof body !== 'object') {
    errors.push('Request body must be an object');
    return { isValid: false, errors };
  }
  
  const data = body as Record<string, unknown>;
  
  if (!data.companyName || typeof data.companyName !== 'string') {
    errors.push('companyName is required and must be a string');
  }
  
  if (!data.industry || typeof data.industry !== 'string') {
    errors.push('industry is required and must be a string');
  }
  
  if (!data.problemStatement || typeof data.problemStatement !== 'string') {
    errors.push('problemStatement is required and must be a string');
  }
  
  if (!data.targetUsers || typeof data.targetUsers !== 'string') {
    errors.push('targetUsers is required and must be a string');
  }
  
  if (!data.timeline || typeof data.timeline !== 'string') {
    errors.push('timeline is required and must be a string');
  }
  
  if (!data.budget || typeof data.budget !== 'string') {
    errors.push('budget is required and must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generate unique session ID
function generateSessionId(): string {
  return `agentic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Cohere API key is configured
    if (!validateCohereApiKey()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cohere API key is not configured. Please set COHERE_API_KEY environment variable.'
        } as StartAgenticSessionResponse,
        { status: 500 }
      );
    }

    // Parse request body
    let body: StartAgenticSessionRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body'
        } as StartAgenticSessionResponse,
        { status: 400 }
      );
    }

    // Validate request body
    const validation = validateRequestBody(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation errors: ${validation.errors.join(', ')}`
        } as StartAgenticSessionResponse,
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = generateSessionId();

    console.log(`Starting agentic conversation session ${sessionId} for ${body.companyName}`);

    // Create initial session data
    const sessionData: AgenticSessionData = {
      conversationResult: {
        messages: [],
        artifacts: {},
        summary: {
          totalMessages: 0,
          totalArtifacts: 0,
          participatingAgents: [],
          duration: 0,
          phases: []
        },
        pmSummary: ''
      },
      projectBrief: {
        companyName: body.companyName,
        industry: body.industry,
        problemStatement: body.problemStatement,
        targetUsers: body.targetUsers,
        keyFeatureIdea: body.keyFeatureIdea,
        timeline: body.timeline,
        budget: body.budget,
        additionalContext: body.additionalContext
      },
      isComplete: false,
      currentPhase: 'initial_discussion'
    };

    // Store session data
    agenticSessions.set(sessionId, sessionData);
    saveAgenticSessionToFile(sessionId, sessionData);

    // Start the agentic conversation in the background
    runAgenticConversation(
      {
        companyName: body.companyName,
        industry: body.industry,
        problemStatement: body.problemStatement,
        targetUsers: body.targetUsers,
        timeline: body.timeline,
        budget: body.budget,
        additionalContext: body.additionalContext
      },
      (message: AgentMessage) => {
        // Real-time message callback
        const session = agenticSessions.get(sessionId);
        if (session) {
          session.conversationResult.messages.push(message);
          
          // Update current phase based on message
          if (message.messageType === 'summary') {
            session.currentPhase = 'finalization';
          }
          
          // Broadcast to SSE clients
          broadcastToSSEClients(sessionId, {
            type: 'message',
            message,
            currentPhase: session.currentPhase
          });
          
          // Save updated session
          saveAgenticSessionToFile(sessionId, session);
        }
      }
    ).then((result) => {
      // Conversation completed
      const session = agenticSessions.get(sessionId);
      if (session) {
        session.conversationResult = result;
        session.isComplete = true;
        session.currentPhase = 'completed';
        
        // Broadcast completion
        broadcastToSSEClients(sessionId, {
          type: 'complete',
          result,
          isComplete: true
        });
        
        // Save final session
        saveAgenticSessionToFile(sessionId, session);
      }
    }).catch((error) => {
      console.error('Error in agentic conversation:', error);
      
      // Broadcast error
      broadcastToSSEClients(sessionId, {
        type: 'error',
        error: error.message
      });
    });

    // Return initial response
    return NextResponse.json({
      success: true,
      sessionId,
      data: {
        messages: sessionData.conversationResult.messages,
        artifacts: sessionData.conversationResult.artifacts,
        summary: sessionData.conversationResult.summary,
        pmSummary: sessionData.conversationResult.pmSummary,
        projectBrief: sessionData.projectBrief,
        isComplete: sessionData.isComplete,
        currentPhase: sessionData.currentPhase
      }
    } as StartAgenticSessionResponse);

  } catch (error) {
    console.error('Error in agentic-session API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as StartAgenticSessionResponse,
      { status: 500 }
    );
  }
}

// GET method to retrieve existing session or stream updates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const stream = searchParams.get('stream') === 'true';

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionId query parameter is required'
        },
        { status: 400 }
      );
    }

    // Handle SSE streaming
    if (stream) {
      const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const stream = new ReadableStream({
        start(controller) {
          // Add client to SSE clients
          addSSEClient(sessionId, {
            id: clientId,
            response: new NextResponse(),
            controller
          });
          
          // Send initial connection message
          const message = `data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`;
          controller.enqueue(new TextEncoder().encode(message));
        },
        cancel() {
          // Remove client when connection closes
          removeSSEClient(sessionId, clientId);
        }
      });

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Regular GET request for session data
    let session = agenticSessions.get(sessionId);
    
    if (!session) {
      session = loadAgenticSessionFromFile(sessionId);
      
      if (session) {
        agenticSessions.set(sessionId, session);
      }
    }
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId,
      data: {
        messages: session.conversationResult.messages,
        artifacts: session.conversationResult.artifacts,
        summary: session.conversationResult.summary,
        pmSummary: session.conversationResult.pmSummary,
        projectBrief: session.projectBrief,
        isComplete: session.isComplete,
        currentPhase: session.currentPhase
      }
    });

  } catch (error) {
    console.error('Error retrieving agentic session:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// DELETE method to clear session
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionId query parameter is required'
        },
        { status: 400 }
      );
    }

    const deleted = agenticSessions.delete(sessionId);
    
    // Also clean up SSE clients
    sseClients.delete(sessionId);
    
    return NextResponse.json({
      success: true,
      message: deleted ? 'Agentic session deleted successfully' : 'Session not found'
    });

  } catch (error) {
    console.error('Error deleting agentic session:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
