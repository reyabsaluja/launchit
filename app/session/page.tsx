"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatWindow from '@/components/ChatWindow';
import ArtifactTabs from '@/components/ArtifactTabs';
import ExportButton from '@/components/ExportButton';
import { ConversationMessage, Artifact } from '@/lib/orchestrator';

interface SessionData {
  conversation: ConversationMessage[];
  artifacts: Record<string, Artifact>;
  projectBrief: {
    companyName: string;
    industry: string;
    problemStatement: string;
    targetUsers: string;
    keyFeatureIdea: string;
    timeline: string;
    budget: string;
  };
}

function SessionContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionData(sessionId);
    } else {
      setError('No session ID provided');
      setLoading(false);
    }
  }, [sessionId]);

  const loadSessionData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/start-session?sessionId=${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSessionData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load session data');
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleArtifactUpdate = (artifactId: string, newContent: string) => {
    if (!sessionData) return;
    
    setSessionData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        artifacts: {
          ...prev.artifacts,
          [artifactId]: {
            ...prev.artifacts[artifactId],
            content: newContent
          }
        }
      };
    });
    
    console.log(`Updated artifact ${artifactId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Session</h2>
          <p className="text-gray-600">Preparing your startup planning session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Session Data</h2>
          <p className="text-gray-600">Unable to load session information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Session Info */}
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {sessionData.projectBrief.companyName} - Startup Planning Session
              </h1>
              <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                <span>Industry: {sessionData.projectBrief.industry}</span>
                <span>•</span>
                <span>Timeline: {sessionData.projectBrief.timeline}</span>
                <span>•</span>
                <span>Budget: {sessionData.projectBrief.budget}</span>
              </div>
            </div>
            
            {/* Export Button */}
            <div className="flex-shrink-0">
              <ExportButton 
                artifacts={sessionData.artifacts}
                showStats={true}
                variant="primary"
                size="md"
              />
            </div>
          </div>
          
          {/* Brief Summary */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Problem Statement</h3>
                <p className="text-gray-700 line-clamp-2">{sessionData.projectBrief.problemStatement}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Target Users</h3>
                <p className="text-gray-700 line-clamp-2">{sessionData.projectBrief.targetUsers}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-280px)]">
          {/* Left: Chat Window */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-full">
              <ChatWindow 
                messages={sessionData.conversation}
                className="h-full"
              />
            </div>
          </div>

          {/* Right: Artifact Tabs */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-full">
              <ArtifactTabs 
                artifacts={sessionData.artifacts}
                onArtifactUpdate={handleArtifactUpdate}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Layout Adjustments */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .grid-cols-1.lg\\:grid-cols-2 {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .h-\\[calc\\(100vh-280px\\)\\] {
            height: auto;
            min-height: 500px;
          }
          
          .h-\\[calc\\(100vh-280px\\)\\] > div {
            height: 500px;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Session</h2>
          <p className="text-gray-600">Preparing your startup planning session...</p>
        </div>
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
