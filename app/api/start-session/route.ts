import { NextRequest, NextResponse } from 'next/server';
import { runConversation, ConversationResult, ConversationMessage, Artifact } from '@/lib/orchestrator';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
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

// File-based session storage for persistence
const SESSIONS_DIR = join(process.cwd(), '.sessions');
if (!existsSync(SESSIONS_DIR)) {
  mkdirSync(SESSIONS_DIR, { recursive: true });
}

function saveSessionToFile(sessionId: string, sessionData: SessionData) {
  try {
    const filePath = join(SESSIONS_DIR, `${sessionId}.json`);
    writeFileSync(filePath, JSON.stringify(sessionData, null, 2));
  } catch (error) {
    console.error('Error saving session to file:', error);
  }
}

function loadSessionFromFile(sessionId: string): SessionData | undefined {
  try {
    const filePath = join(SESSIONS_DIR, `${sessionId}.json`);
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading session from file:', error);
  }
  return undefined;
}

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
    } catch {
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
    
    // Store in both memory and file for persistence
    conversationSessions.set(sessionId, sessionData);
    saveSessionToFile(sessionId, sessionData);
    
    console.log(`Stored session ${sessionId} in memory and file. Total sessions: ${conversationSessions.size}`);
    console.log(`All session IDs: ${Array.from(conversationSessions.keys()).join(', ')}`);

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

    console.log(`GET request for sessionId: ${sessionId}`);
    console.log(`Available sessions in memory: ${Array.from(conversationSessions.keys()).join(', ')}`);
    
    // Try to get from memory first, then from file
    let session = conversationSessions.get(sessionId);
    
    if (!session) {
      console.log(`Session ${sessionId} not found in memory, trying file...`);
      session = loadSessionFromFile(sessionId);
      
      if (session) {
        // Load back into memory for future requests
        conversationSessions.set(sessionId, session);
        console.log(`Session ${sessionId} loaded from file and cached in memory`);
      }
    }
    
    if (!session) {
      console.log(`Session ${sessionId} not found in memory or file. Available sessions:`, Array.from(conversationSessions.keys()));
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
