"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ConversationMessage } from "@/lib/orchestrator";

// Agent configuration for styling
const agentConfig = {
  product_manager: {
    name: "Alex Chen",
    role: "Product Manager",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: "👤"
  },
  senior_engineer: {
    name: "Jordan Kim", 
    role: "Senior Engineer",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    icon: "⚡"
  },
  project_manager: {
    name: "Sam Taylor",
    role: "Project Manager", 
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    icon: "📋"
  },
  marketing_lead: {
    name: "Riley Morgan",
    role: "Marketing Lead",
    color: "bg-purple-500", 
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    icon: "📢"
  }
};

interface ChatWindowProps {
  messages: ConversationMessage[];
  isLoading?: boolean;
  className?: string;
}

interface MessageBubbleProps {
  message: ConversationMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
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

  return (
    <div className="flex items-start space-x-3 mb-6">
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${agent.color} flex items-center justify-center text-white font-medium shadow-sm`}>
        <span className="text-lg">{agent.icon}</span>
      </div>
      
      {/* Message Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">
            {agent.name}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${agent.bgColor} ${agent.textColor} font-medium`}>
            {agent.role}
          </span>
          <span className="text-xs text-gray-500">
            {formatTimestamp(message.timestamp)}
          </span>
          {message.hasArtifact && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              📄 {message.artifactType}
            </span>
          )}
        </div>
        
        {/* Message Bubble */}
        <div className={`rounded-lg p-3 ${agent.bgColor} border border-gray-100`}>
          <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-start space-x-3 mb-6">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-300 flex items-center justify-center animate-pulse">
        <span className="text-lg">💭</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-gray-500 text-sm">
            AI Agents
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            Collaborating
          </span>
        </div>
        <div className="rounded-lg p-3 bg-gray-50 border border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-sm text-gray-600 italic">
              Agents are discussing your project...
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
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl">💬</span>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Ready for Agent Discussion
      </h3>
      <p className="text-gray-600 max-w-sm">
        Your AI team is ready to collaborate on your startup plan. Start a session to begin the conversation.
      </p>
    </div>
  );
}

export default function ChatWindow({ messages, isLoading = false, className = "" }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [shouldAutoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 5;
    setShouldAutoScroll(isAtBottom);
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Agent Planning Session
            </h2>
            <p className="text-sm text-gray-600">
              {messages.length > 0 
                ? `${messages.length} messages from your AI team`
                : "Your AI agents are ready to collaborate"
              }
            </p>
          </div>
          
          {/* Agent Status Indicators */}
          <div className="flex space-x-2">
            {Object.entries(agentConfig).map(([id, agent]) => {
              const hasParticipated = messages.some(msg => msg.agentId === id);
              return (
                <div
                  key={id}
                  className={`w-8 h-8 rounded-lg ${agent.color} flex items-center justify-center text-white text-sm relative`}
                  title={`${agent.name} - ${agent.role}`}
                >
                  <span>{agent.icon}</span>
                  {hasParticipated && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        onScroll={handleScroll}
      >
        {messages.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            
            {isLoading && <LoadingIndicator />}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Auto-scroll indicator */}
      {!shouldAutoScroll && messages.length > 0 && (
        <div className="flex-shrink-0 px-6 py-2">
          <button
            onClick={() => {
              setShouldAutoScroll(true);
              scrollToBottom();
            }}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            ↓ Scroll to latest messages
          </button>
        </div>
      )}
    </div>
  );
}
