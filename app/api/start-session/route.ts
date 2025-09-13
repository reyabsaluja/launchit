import { NextRequest, NextResponse } from 'next/server';
import { runConversation, ConversationResult, ConversationMessage, Artifact } from '@/lib/orchestrator';
import { validateCohereApiKey } from '@/lib/cohere';

// Enhanced session data structure
interface SessionData {
  conversationResult: ConversationResult;
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
}

// In-memory storage for conversation sessions
const conversationSessions = new Map<string, SessionData>();

// Types for API request/response
interface StartSessionRequest {
  companyName: string;
  industry: string;
  problemStatement: string;
  targetUsers: string;
  keyFeatureIdea?: string;
  timeline: string;
  budget: string;
  additionalContext?: string;
}

interface StartSessionResponse {
  success: boolean;
  sessionId?: string;
  data?: {
    conversation: ConversationMessage[];
    artifacts: Record<string, Artifact>;
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
  };
  error?: string;
}

// Validate request body
function validateRequestBody(body: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!body.companyName || typeof body.companyName !== 'string') {
    errors.push('companyName is required and must be a string');
  }
  
  if (!body.industry || typeof body.industry !== 'string') {
    errors.push('industry is required and must be a string');
  }
  
  if (!body.problemStatement || typeof body.problemStatement !== 'string') {
    errors.push('problemStatement is required and must be a string');
  }
  
  if (!body.targetUsers || typeof body.targetUsers !== 'string') {
    errors.push('targetUsers is required and must be a string');
  }
  
  if (!body.timeline || typeof body.timeline !== 'string') {
    errors.push('timeline is required and must be a string');
  }
  
  if (!body.budget || typeof body.budget !== 'string') {
    errors.push('budget is required and must be a string');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Generate unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Cohere API key is configured
    if (!validateCohereApiKey()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cohere API key is not configured. Please set COHERE_API_KEY environment variable.'
        } as StartSessionResponse,
        { status: 500 }
      );
    }

    // Parse request body
    let body: StartSessionRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body'
        } as StartSessionResponse,
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
        } as StartSessionResponse,
        { status: 400 }
      );
    }

    // Generate session ID
    const sessionId = generateSessionId();

    console.log(`Starting conversation session ${sessionId} for ${body.companyName}`);

    // Run the conversation
    const conversationResult = await runConversation({
      companyName: body.companyName,
      industry: body.industry,
      problemStatement: body.problemStatement,
      targetUsers: body.targetUsers,
      timeline: body.timeline,
      budget: body.budget,
      additionalContext: body.additionalContext
    });

    // Store session data with project brief
    const sessionData: SessionData = {
      conversationResult,
      projectBrief: {
        companyName: body.companyName,
        industry: body.industry,
        problemStatement: body.problemStatement,
        targetUsers: body.targetUsers,
        keyFeatureIdea: body.keyFeatureIdea,
        timeline: body.timeline,
        budget: body.budget,
        additionalContext: body.additionalContext
      }
    };
    
    conversationSessions.set(sessionId, sessionData);

    console.log(`Session ${sessionId} completed successfully`);
    console.log(`Generated ${conversationResult.summary.totalMessages} messages and ${conversationResult.summary.totalArtifacts} artifacts`);

    // Return successful response
    return NextResponse.json({
      success: true,
      sessionId,
      data: {
        conversation: conversationResult.conversation,
        artifacts: conversationResult.artifacts,
        projectBrief: sessionData.projectBrief
      }
    } as StartSessionResponse);

  } catch (error) {
    console.error('Error in start-session API:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      } as StartSessionResponse,
      { status: 500 }
    );
  }
}

// GET method to retrieve existing session
export async function GET(request: NextRequest) {
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

    const session = conversationSessions.get(sessionId);
    
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
        conversation: session.conversationResult.conversation,
        artifacts: session.conversationResult.artifacts,
        projectBrief: session.projectBrief
      }
    });

  } catch (error) {
    console.error('Error retrieving session:', error);
    
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

    const deleted = conversationSessions.delete(sessionId);
    
    return NextResponse.json({
      success: true,
      message: deleted ? 'Session deleted successfully' : 'Session not found'
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// Utility function to get all sessions (for debugging)
export async function OPTIONS() {
  const sessionIds = Array.from(conversationSessions.keys());
  
  return NextResponse.json({
    success: true,
    totalSessions: sessionIds.length,
    sessionIds
  });
}
