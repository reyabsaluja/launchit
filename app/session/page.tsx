"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatWindow from '@/components/ChatWindow';
import ArtifactTabs from '@/components/ArtifactTabs';
import ExportButton from '@/components/ExportButton';
import { ConversationMessage, Artifact } from '@/lib/orchestrator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle, Home, Building2, Users, Target, Clock, DollarSign } from 'lucide-react';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Session</h2>
          <p className="text-muted-foreground">Preparing your startup planning session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="mb-2">Session Error</CardTitle>
            <CardDescription className="mb-4">{error}</CardDescription>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Session Data</h2>
          <p className="text-muted-foreground">Unable to load session information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-start justify-between mb-6">
            {/* Session Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold">
                  {sessionData.projectBrief.companyName}
                </h1>
              </div>
              <p className="text-muted-foreground mb-4">AI-Generated Startup Planning Session</p>
              
              {/* Project Metadata */}
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="gap-1">
                  <Building2 className="h-3 w-3" />
                  {sessionData.projectBrief.industry}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {sessionData.projectBrief.timeline}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="h-3 w-3" />
                  {sessionData.projectBrief.budget}
                </Badge>
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
          
          {/* Project Brief Summary */}
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Problem Statement</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {sessionData.projectBrief.problemStatement}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Target Users</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {sessionData.projectBrief.targetUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-[calc(100vh-400px)]">
          {/* Left: Chat Window */}
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">AI Agent Conversation</CardTitle>
              <CardDescription>
                Watch our AI agents collaborate to build your startup plan
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <div className="h-[600px]">
                <ChatWindow 
                  messages={sessionData.conversation}
                  className="h-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Right: Artifact Tabs */}
          <Card className="border-border/50 shadow-lg overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Your Startup Deliverables</CardTitle>
              <CardDescription>
                Review and edit your generated startup documents
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <div className="h-[600px]">
                <ArtifactTabs 
                  artifacts={sessionData.artifacts}
                  onArtifactUpdate={handleArtifactUpdate}
                  className="h-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Session</h2>
          <p className="text-muted-foreground">Preparing your startup planning session...</p>
        </div>
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}
