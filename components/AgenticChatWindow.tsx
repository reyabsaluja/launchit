"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AgentMessage } from "@/lib/agenticOrchestrator";

// Agent configuration for styling - Modern, clean colors
const agentConfig = {
  product_manager: {
    name: "Alex Chen",
    role: "Product Manager",
    color: "bg-slate-700",
    textColor: "text-slate-200",
    bgColor: "bg-slate-50 dark:bg-slate-900/50",
    borderColor: "border-slate-200 dark:border-slate-700",
    icon: "👤"
  },
  senior_engineer: {
    name: "Jordan Kim", 
    role: "Senior Engineer",
    color: "bg-emerald-600",
    textColor: "text-emerald-200",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/50",
    borderColor: "border-emerald-200 dark:border-emerald-700",
    icon: "⚡"
  },
  project_manager: {
    name: "Sam Taylor",
    role: "Project Manager", 
    color: "bg-amber-600",
    textColor: "text-amber-200",
    bgColor: "bg-amber-50 dark:bg-amber-900/50",
    borderColor: "border-amber-200 dark:border-amber-700",
    icon: "📋"
  },
  marketing_lead: {
    name: "Riley Morgan",
    role: "Marketing Lead",
    color: "bg-violet-600", 
    textColor: "text-violet-200",
    bgColor: "bg-violet-50 dark:bg-violet-900/50",
    borderColor: "border-violet-200 dark:border-violet-700",
    icon: "📢"
  },
  facilitator: {
    name: "Session Facilitator",
    role: "Facilitator",
    color: "bg-gray-600",
    textColor: "text-gray-200",
    bgColor: "bg-gray-50 dark:bg-gray-900/50",
    borderColor: "border-gray-200 dark:border-gray-700",
    icon: "🎯"
  }
};

// Phase configuration - Clean, modern styling
const phaseConfig = {
  initial_discussion: {
    name: "Initial Discussion",
    description: "Agents are sharing their initial thoughts and perspectives",
    color: "bg-slate-600",
    icon: "💭"
  },
  deep_dive: {
    name: "Deep Dive",
    description: "Creating detailed plans and technical specifications",
    color: "bg-emerald-600",
    icon: "🔍"
  },
  consolidation: {
    name: "Consolidation",
    description: "Finalizing deliverables and ensuring alignment",
    color: "bg-amber-600",
    icon: "🔧"
  },
  finalization: {
    name: "Summary",
    description: "Product Manager providing final summary",
    color: "bg-violet-600",
    icon: "📋"
  },
  completed: {
    name: "Completed",
    description: "Planning session complete",
    color: "bg-emerald-600",
    icon: "✅"
  }
};

interface AgenticChatWindowProps {
  sessionId: string;
  messages: AgentMessage[];
  isLoading?: boolean;
  currentPhase?: string;
  isComplete?: boolean;
  className?: string;
}

interface MessageBubbleProps {
  message: AgentMessage;
  isLatest?: boolean;
}

function MessageBubble({ message, isLatest = false }: MessageBubbleProps) {
  const agent = agentConfig[message.agentId as keyof typeof agentConfig];
  
  if (!agent) {
    return null;
  }

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getMessageTypeStyle = (messageType: AgentMessage['messageType']) => {
    switch (messageType) {
      case 'summary':
        return 'border-l-4 border-l-purple-500';
      case 'deliverable':
        return 'border-l-4 border-l-green-500';
      case 'question':
        return 'border-l-4 border-l-yellow-500';
      default:
        return '';
    }
  };

  return (
    <div className={`flex items-start space-x-3 mb-6 ${isLatest ? 'animate-fade-in' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${agent.color} flex items-center justify-center text-white font-medium shadow-sm ${isLatest ? 'animate-pulse' : ''}`}>
        <span className="text-lg">{agent.icon}</span>
      </div>
      
      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-foreground text-sm">
            {agent.name}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${agent.bgColor} ${agent.textColor} font-medium`}>
            {agent.role}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.messageType === 'summary' && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
              📋 Summary
            </span>
          )}
          {message.artifacts && message.artifacts.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              📄 Deliverable
            </span>
          )}
        </div>
        
        {/* Message Bubble */}
        <div className={`rounded-lg p-3 ${agent.bgColor} border border-border ${getMessageTypeStyle(message.messageType)}`}>
          <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhaseIndicator({ currentPhase }: { currentPhase: string }) {
  const phase = phaseConfig[currentPhase as keyof typeof phaseConfig];
  
  if (!phase) return null;
  
  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
      <div className={`w-8 h-8 rounded-full ${phase.color} flex items-center justify-center text-white text-sm`}>
        <span>{phase.icon}</span>
      </div>
      <div>
        <div className="font-medium text-sm text-foreground">{phase.name}</div>
        <div className="text-xs text-muted-foreground">{phase.description}</div>
      </div>
    </div>
  );
}

function LoadingIndicator({ currentPhase }: { currentPhase?: string }) {
  const phase = currentPhase ? phaseConfig[currentPhase as keyof typeof phaseConfig] : null;
  
  return (
    <div className="flex items-start space-x-3 mb-6">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center animate-pulse">
        <span className="text-lg">💭</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-muted-foreground text-sm">
            AI Agents
          </span>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">
            {phase ? phase.name : 'Collaborating'}
          </span>
        </div>
        <div className="rounded-lg p-3 bg-muted/50 border border-border">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-muted-foreground italic">
              {phase ? phase.description : 'Agents are discussing your project...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">🤖</span>
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Ready for Agentic Discussion
      </h3>
      <p className="text-muted-foreground max-w-sm">
        Your AI team will collaborate in real-time, discussing your startup plan and creating deliverables together.
      </p>
    </div>
  );
}

export default function AgenticChatWindow({ 
  sessionId, 
  messages, 
  isLoading = false, 
  currentPhase = 'initial_discussion',
  isComplete = false,
  className = "" 
}: AgenticChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [realtimeMessages, setRealtimeMessages] = useState<AgentMessage[]>(messages);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [shouldAutoScroll]);

  // Set up Server-Sent Events for real-time updates
  useEffect(() => {
    if (!sessionId) {
      console.log('No sessionId provided, skipping SSE setup');
      return;
    }
    
    console.log(`Setting up SSE connection for session: ${sessionId}`);
    setConnectionStatus('connecting');
    
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    
    const setupSSE = () => {
      try {
        eventSource = new EventSource(`/api/agentic-session?sessionId=${sessionId}&stream=true`);
        
        eventSource.onopen = () => {
          console.log('✅ SSE connection opened successfully');
          setConnectionStatus('connected');
          // Clear any pending reconnect attempts
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
          }
        };
        
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 SSE message received:', data.type, data);
            
            if (data.type === 'message') {
              console.log('➕ Adding new message to chat:', {
                agentName: data.message.agentName,
                content: data.message.content.substring(0, 100) + '...',
                messageId: data.message.id
              });
              
              setRealtimeMessages(prev => {
                // Avoid duplicates by checking message ID
                const exists = prev.some(msg => msg.id === data.message.id);
                if (exists) {
                  console.log('⚠️ Duplicate message detected, skipping:', data.message.id);
                  return prev;
                }
                const newMessages = [...prev, data.message];
                console.log(`📊 Total messages now: ${newMessages.length}`);
                return newMessages;
              });
            } else if (data.type === 'complete') {
              console.log('✅ Agentic conversation completed');
              setConnectionStatus('disconnected');
              // Don't force reload, just update the UI state
            } else if (data.type === 'error') {
              console.error('❌ Agentic conversation error:', data.error);
              setConnectionStatus('disconnected');
            } else if (data.type === 'connected') {
              console.log('🔗 SSE client connected:', data.clientId);
            }
          } catch (error) {
            console.error('❌ Error parsing SSE data:', error, 'Raw data:', event.data);
          }
        };
        
        eventSource.onerror = (error) => {
          console.error('❌ SSE connection error:', error, 'ReadyState:', eventSource?.readyState);
          setConnectionStatus('disconnected');
          
          // Close the current connection
          if (eventSource) {
            eventSource.close();
          }
          
          // Attempt to reconnect after a delay
          if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
              console.log('🔄 Attempting to reconnect SSE...');
              setConnectionStatus('connecting');
              setupSSE();
            }, 3000);
          }
        };
      } catch (error) {
        console.error('❌ Error setting up SSE:', error);
        setConnectionStatus('disconnected');
      }
    };
    
    setupSSE();
    
    return () => {
      console.log('🔌 Cleaning up SSE connection');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
      setConnectionStatus('disconnected');
    };
  }, [sessionId]);

  // Update messages when props change
  useEffect(() => {
    console.log('AgenticChatWindow: Received messages prop:', {
      count: messages?.length || 0,
      messages: messages?.map(m => ({ id: m.id, agentName: m.agentName, contentPreview: m.content.substring(0, 50) + '...' }))
    });
    
    // Only update if we have messages and they're different from current state
    if (messages && messages.length > 0) {
      setRealtimeMessages(prevMessages => {
        // If we have no previous messages, use the new ones
        if (prevMessages.length === 0) {
          console.log('📥 Setting initial messages from props');
          return messages;
        }
        
        // Merge messages, avoiding duplicates
        const existingIds = new Set(prevMessages.map(m => m.id));
        const newMessages = messages.filter(m => !existingIds.has(m.id));
        
        if (newMessages.length > 0) {
          console.log(`📥 Adding ${newMessages.length} new messages from props`);
          return [...prevMessages, ...newMessages];
        }
        
        return prevMessages;
      });
    } else if (messages && messages.length === 0) {
      // If props explicitly provide an empty array, reset our state
      console.log('🔄 Resetting messages to empty array from props');
      setRealtimeMessages([]);
    }
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, [realtimeMessages, isLoading, scrollToBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5;
    setShouldAutoScroll(isAtBottom);
  };

  return (
    <div className={`flex flex-col h-full bg-card ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Agentic Planning Session
            </h2>
            <p className="text-sm text-muted-foreground">
              {realtimeMessages.length > 0 
                ? `${realtimeMessages.length} messages from your AI team`
                : "Your AI agents are ready to collaborate"
              }
            </p>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`}></div>
            <span className="text-xs text-muted-foreground capitalize">
              {connectionStatus}
            </span>
          </div>
        </div>
        
        {/* Phase Indicator */}
        <PhaseIndicator currentPhase={currentPhase} />
        
        {/* Agent Status Indicators */}
        <div className="flex space-x-2 mt-3">
          {Object.entries(agentConfig).filter(([id]) => id !== 'facilitator').map(([id, agent]) => {
            const hasParticipated = realtimeMessages.some(msg => msg.agentId === id);
            const isCurrentlySpeaking = realtimeMessages[realtimeMessages.length - 1]?.agentId === id;
            return (
              <div
                key={id}
                className={`w-8 h-8 rounded-lg ${agent.color} flex items-center justify-center text-white text-sm relative ${
                  isCurrentlySpeaking ? 'animate-pulse ring-2 ring-white/50' : ''
                }`}
                title={`${agent.name} - ${agent.role}`}
              >
                <span>{agent.icon}</span>
                {hasParticipated && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-card"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        onScroll={handleScroll}
      >
        {realtimeMessages.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <>
            {realtimeMessages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isLatest={index === realtimeMessages.length - 1 && !isComplete}
              />
            ))}
            
            {isLoading && !isComplete && <LoadingIndicator currentPhase={currentPhase} />}
            
            {isComplete && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200">
                  <span className="text-lg">✅</span>
                  <span className="font-medium">Planning session completed!</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!shouldAutoScroll && realtimeMessages.length > 0 && (
        <div className="flex-shrink-0 px-6 py-2">
          <button
            onClick={() => {
              setShouldAutoScroll(true);
              scrollToBottom();
            }}
            className="w-full text-center text-sm text-primary hover:text-primary/80 py-2 bg-primary/10 rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            ↓ Scroll to latest messages
          </button>
        </div>
      )}
    </div>
  );
}
