"use client";

import { useState, useEffect } from "react";
import ChatWindow from "@/components/ChatWindow";
import { ConversationMessage } from "@/lib/orchestrator";

// Mock data for demonstration
const mockMessages: ConversationMessage[] = [
  {
    id: "msg_1",
    agentId: "product_manager",
    agentName: "Alex Chen",
    role: "Product Manager",
    content: "Based on the brief for FoodieConnect, our users are college students aged 18-24. Core need: affordable, healthy meals that fit busy schedules. I suggest MVP = user onboarding, meal selection, payment integration, and delivery tracking.",
    timestamp: new Date(Date.now() - 240000),
    hasArtifact: true,
    artifactType: "PRD"
  },
  {
    id: "msg_2", 
    agentId: "senior_engineer",
    agentName: "Jordan Kim",
    role: "Senior Engineer",
    content: "That's quite broad for a 2-week timeline. Payment integration and delivery tracking are complex. I recommend we focus on core ordering flow first - user auth, restaurant browsing, simple ordering. We can stub payment with Stripe test mode and basic SMS notifications for delivery updates.",
    timestamp: new Date(Date.now() - 180000),
    hasArtifact: false
  },
  {
    id: "msg_3",
    agentId: "project_manager", 
    agentName: "Sam Taylor",
    role: "Project Manager",
    content: "Given the timeline constraints, let me propose: Week 1 = user auth + restaurant catalog + ordering flow. Week 2 = payment integration + basic notifications + deployment. This keeps us realistic while hitting core functionality.",
    timestamp: new Date(Date.now() - 120000),
    hasArtifact: true,
    artifactType: "Timeline"
  },
  {
    id: "msg_4",
    agentId: "marketing_lead",
    agentName: "Riley Morgan", 
    role: "Marketing Lead",
    content: "Perfect! With that scope, I can craft messaging around speed and convenience. Thinking: 'FoodieConnect - Healthy meals, delivered fast. Made for students, by students.' Clean design with university branding. We'll need landing page copy and social media assets for launch.",
    timestamp: new Date(Date.now() - 60000),
    hasArtifact: true,
    artifactType: "Marketing"
  }
];

// Example 1: Basic ChatWindow usage
export function BasicChatExample() {
  return (
    <div className="h-96 border border-gray-200 rounded-lg">
      <ChatWindow messages={mockMessages} />
    </div>
  );
}

// Example 2: Loading state
export function LoadingChatExample() {
  return (
    <div className="h-96 border border-gray-200 rounded-lg">
      <ChatWindow messages={mockMessages.slice(0, 2)} isLoading={true} />
    </div>
  );
}

// Example 3: Empty state
export function EmptyChatExample() {
  return (
    <div className="h-96 border border-gray-200 rounded-lg">
      <ChatWindow messages={[]} />
    </div>
  );
}

// Example 4: Real-time message simulation
export function RealTimeChatExample() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const simulateConversation = () => {
    setMessages([]);
    setIsLoading(true);

    // Add messages one by one with delays
    mockMessages.forEach((message, index) => {
      setTimeout(() => {
        setMessages(prev => [...prev, message]);
        
        // Stop loading after last message
        if (index === mockMessages.length - 1) {
          setIsLoading(false);
        }
      }, (index + 1) * 2000);
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={simulateConversation}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Start Simulation
      </button>
      <div className="h-96 border border-gray-200 rounded-lg">
        <ChatWindow messages={messages} isLoading={isLoading} />
      </div>
    </div>
  );
}

// Example 5: Integration with API
export function ApiIntegratedChatExample() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const startSession = async () => {
    setIsLoading(true);
    setMessages([]);

    const projectBrief = {
      companyName: "FoodieConnect",
      industry: "Food Delivery",
      problemStatement: "College students struggle to find affordable, healthy meals that fit their busy schedules and limited budgets.",
      targetUsers: "College students aged 18-24 who live on or near campus",
      timeline: "2 weeks MVP, 3 months full launch",
      budget: "$25k bootstrap funding"
    };

    try {
      const response = await fetch('/api/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectBrief)
      });

      const result = await response.json();

      if (result.success) {
        setSessionId(result.sessionId);
        setMessages(result.data.conversation);
      } else {
        console.error('Session failed:', result.error);
      }
    } catch (error) {
      console.error('API call failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={startSession}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? 'Starting Session...' : 'Start Real Session'}
        </button>
        {sessionId && (
          <span className="text-sm text-gray-600">
            Session: {sessionId}
          </span>
        )}
      </div>
      <div className="h-96 border border-gray-200 rounded-lg">
        <ChatWindow messages={messages} isLoading={isLoading} />
      </div>
    </div>
  );
}

// Example 6: Full-screen chat layout
export function FullScreenChatExample() {
  return (
    <div className="fixed inset-0 bg-gray-100">
      <div className="h-full max-w-4xl mx-auto bg-white shadow-lg">
        <ChatWindow messages={mockMessages} className="h-full" />
      </div>
    </div>
  );
}

// Main demo component
export default function ChatWindowDemo() {
  const [activeExample, setActiveExample] = useState<string>("basic");

  const examples = {
    basic: { component: <BasicChatExample />, title: "Basic Chat" },
    loading: { component: <LoadingChatExample />, title: "Loading State" },
    empty: { component: <EmptyChatExample />, title: "Empty State" },
    realtime: { component: <RealTimeChatExample />, title: "Real-time Simulation" },
    api: { component: <ApiIntegratedChatExample />, title: "API Integration" }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ChatWindow Component Examples
        </h1>
        
        {/* Example Selector */}
        <div className="flex space-x-2 mb-6">
          {Object.entries(examples).map(([key, example]) => (
            <button
              key={key}
              onClick={() => setActiveExample(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeExample === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {example.title}
            </button>
          ))}
        </div>
      </div>

      {/* Active Example */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {examples[activeExample as keyof typeof examples].title}
        </h2>
        {examples[activeExample as keyof typeof examples].component}
      </div>
    </div>
  );
}
