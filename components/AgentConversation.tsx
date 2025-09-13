"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  MessageSquare, 
  Sparkles, 
  Clock,
  CheckCircle,
  Loader2
} from "lucide-react";

interface AgentMessage {
  id: string;
  agent: string;
  role: string;
  message: string;
  timestamp: number;
  status: 'thinking' | 'typing' | 'completed';
}

interface AgentConversationProps {
  sessionId: string;
  onComplete: () => void;
  realSessionId?: string;
}

const agents = [
  { name: "Alex Chen", role: "Product Manager", color: "bg-blue-500", icon: "👨‍💼" },
  { name: "Jordan Kim", role: "Senior Software Engineer", color: "bg-green-500", icon: "👩‍💻" },
  { name: "Sam Taylor", role: "Project Manager", color: "bg-purple-500", icon: "👨‍💼" },
  { name: "Riley Morgan", role: "Marketing Lead", color: "bg-pink-500", icon: "👩‍💼" },
];

const sampleConversation: AgentMessage[] = [
  {
    id: "1",
    agent: "Alex Chen",
    role: "Product Manager",
    message: "Let me analyze this startup idea. The problem statement is clear, but I need to understand the market size and competitive landscape better.",
    timestamp: Date.now() - 30000,
    status: 'completed'
  },
  {
    id: "2", 
    agent: "Jordan Kim",
    role: "Senior Software Engineer",
    message: "From a technical perspective, this looks feasible. I'm thinking we could start with a MVP using React and Node.js, then scale with microservices.",
    timestamp: Date.now() - 25000,
    status: 'completed'
  },
  {
    id: "3",
    agent: "Sam Taylor",
    role: "Project Manager", 
    message: "Great insights from both of you. I'll create a 6-month timeline with key milestones. We should prioritize user research in the first month.",
    timestamp: Date.now() - 20000,
    status: 'completed'
  },
  {
    id: "4",
    agent: "Riley Morgan",
    role: "Marketing Lead",
    message: "I love the positioning! Let me develop a go-to-market strategy focusing on social media and content marketing for the target demographic.",
    timestamp: Date.now() - 15000,
    status: 'completed'
  },
  {
    id: "5",
    agent: "Alex Chen", 
    role: "Product Manager",
    message: "Perfect! Now let me synthesize all our insights into a comprehensive Product Requirements Document...",
    timestamp: Date.now() - 10000,
    status: 'typing'
  }
];

export default function AgentConversation({ sessionId, onComplete, realSessionId }: AgentConversationProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Simulate real-time conversation
    let messageIndex = 0;
    const interval = setInterval(() => {
      if (messageIndex < sampleConversation.length) {
        const newMessage = sampleConversation[messageIndex];
        setMessages(prev => [...prev, newMessage]);
        setCurrentAgent(newMessage.agent);
        
        // Update progress
        setProgress(((messageIndex + 1) / sampleConversation.length) * 100);
        
        messageIndex++;
      } else {
        // Conversation complete
        setIsComplete(true);
        setCurrentAgent(null);
        clearInterval(interval);
        
        // Wait for real session ID before redirecting
        const checkForRealSession = () => {
          if (realSessionId && realSessionId !== sessionId) {
            console.log('Real session ID available, redirecting to:', realSessionId);
            setTimeout(() => {
              onComplete();
            }, 2000);
          } else {
            console.log('Waiting for real session ID...');
            setTimeout(checkForRealSession, 1000); // Check again in 1 second
          }
        };
        
        checkForRealSession();
      }
    }, 4000); // New message every 4 seconds (slower for better UX)

    return () => clearInterval(interval);
  }, [onComplete, realSessionId, sessionId]);

  // Update session ID when real session ID becomes available
  useEffect(() => {
    if (realSessionId && realSessionId !== sessionId) {
      console.log('Real session ID updated:', realSessionId);
    }
  }, [realSessionId, sessionId]);

  const getAgentInfo = (agentName: string) => {
    return agents.find(agent => agent.name === agentName) || agents[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center mb-4">
            <Badge variant="outline" className="px-4 py-2 text-lg">
              <Bot className="w-5 h-5 mr-2" />
              AI Agents Collaborating
            </Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Creating Your Startup Pack
          </h1>
          <p className="text-muted-foreground text-lg">
            Our AI agents are analyzing your idea and collaborating to create the perfect startup plan
          </p>
        </motion.div>

        {/* Progress */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {isComplete ? 'Complete!' : 'Agents working...'}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </motion.div>

        {/* Conversation */}
        <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <AnimatePresence>
                {messages.map((message, index) => {
                  const agentInfo = getAgentInfo(message.agent);
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      {/* Agent Avatar */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${agentInfo.color} flex items-center justify-center text-white font-bold text-lg`}>
                        {agentInfo.icon}
                      </div>
                      
                      {/* Message Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-foreground">
                            {message.agent}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {message.role}
                          </Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-foreground leading-relaxed">
                            {message.message}
                          </p>
                          
                          {/* Status indicator */}
                          <div className="flex items-center mt-2 space-x-2">
                            {message.status === 'thinking' && (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Thinking...</span>
                              </>
                            )}
                            {message.status === 'typing' && (
                              <>
                                <div className="flex space-x-1">
                                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                                <span className="text-xs text-muted-foreground">Typing...</span>
                              </>
                            )}
                            {message.status === 'completed' && (
                              <>
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-green-500">Complete</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Current Agent Indicator */}
              {currentAgent && !isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-3 opacity-60"
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getAgentInfo(currentAgent).color} flex items-center justify-center text-white font-bold text-lg`}>
                    {getAgentInfo(currentAgent).icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {currentAgent}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {getAgentInfo(currentAgent).role}
                      </Badge>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Preparing next insight...
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Completion Message */}
              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Collaboration Complete!
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Your startup pack is ready. Preparing your results...
                  </p>
                  {realSessionId && realSessionId !== sessionId ? (
                    <div className="flex items-center justify-center space-x-2 text-green-500">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Session ready! Redirecting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Finalizing your session...</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agent Status */}
        <motion.div 
          className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {agents.map((agent, index) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="flex items-center space-x-2 p-3 bg-card/30 rounded-lg backdrop-blur-sm"
            >
              <div className={`w-6 h-6 rounded-full ${agent.color} flex items-center justify-center text-white text-xs font-bold`}>
                {agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {agent.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {agent.role}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
