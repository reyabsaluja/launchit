"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Target, 
  Users, 
  Lightbulb,
  FileText,
  Calendar,
  Zap,
  Megaphone
} from "lucide-react";
import { useRouter } from "next/navigation";

interface FormData {
  problemStatement: string;
  targetUsers: string;
  keyFeature: string;
}

interface FormErrors {
  problemStatement?: string;
  targetUsers?: string;
  keyFeature?: string;
}

const steps = [
  {
    id: 1,
    title: "What problem are you solving?",
    subtitle: "Every great startup begins with a problem worth solving",
    icon: Target,
    field: "problemStatement" as keyof FormData,
    placeholder: "Describe the problem your startup will solve. Be specific about who faces this problem and why current solutions aren't working...",
    rows: 4,
  },
  {
    id: 2,
    title: "Who are your target users?",
    subtitle: "Understanding your audience is key to building the right solution",
    icon: Users,
    field: "targetUsers" as keyof FormData,
    placeholder: "Describe your ideal customers. Include demographics, behaviors, pain points, and what motivates them...",
    rows: 3,
  },
  {
    id: 3,
    title: "What's your key feature idea?",
    subtitle: "The core functionality that will solve your users' biggest pain point",
    icon: Lightbulb,
    field: "keyFeature" as keyof FormData,
    placeholder: "Describe your main feature or solution. What makes it unique? How will it solve the problem you identified?",
    rows: 3,
  },
];

const deliverables = [
  { icon: FileText, label: "Product Requirements" },
  { icon: Calendar, label: "Project Timeline" },
  { icon: Zap, label: "Engineering Plan" },
  { icon: Megaphone, label: "Marketing Strategy" },
];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    problemStatement: "",
    targetUsers: "",
    keyFeature: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const currentStepData = steps.find(step => step.id === currentStep)!;
  const progress = (currentStep / steps.length) * 100;

  const validateStep = (stepId: number): boolean => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return false;

    const value = formData[step.field];
    const newErrors: FormErrors = { ...errors };

    if (!value || value.trim().length < 10) {
      newErrors[step.field] = `Please provide at least 10 characters for ${step.title.toLowerCase()}`;
      setErrors(newErrors);
      return false;
    }

    delete newErrors[step.field];
    setErrors(newErrors);
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      [currentStepData.field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[currentStepData.field]) {
      setErrors(prev => ({
        ...prev,
        [currentStepData.field]: undefined
      }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Map the onboarding form data to the API's expected format
      const apiPayload = {
        companyName: "My Startup", // Default value since not collected in onboarding
        industry: "Technology", // Default value since not collected in onboarding
        problemStatement: formData.problemStatement,
        targetUsers: formData.targetUsers,
        keyFeatureIdea: formData.keyFeature,
        timeline: "6 months", // Default value since not collected in onboarding
        budget: "$50,000", // Default value since not collected in onboarding
        additionalContext: `Key Feature: ${formData.keyFeature}`
      };

      const response = await fetch('/api/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.sessionId) {
          router.push(`/session?id=${result.sessionId}`);
        } else {
          throw new Error('No session ID returned from API');
        }
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Error starting session:', error);
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleNext();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline" className="px-3 py-1">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Startup Planning
            </Badge>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-2xl bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8">
                {/* Step Header */}
                <div className="text-center mb-8">
                  <motion.div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <currentStepData.icon className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {currentStepData.title}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {currentStepData.subtitle}
                  </p>
                </div>

                {/* Form Input */}
                <div className="space-y-4 mb-8">
                  <Label htmlFor="input" className="text-base font-medium">
                    Tell us more
                  </Label>
                  <Textarea
                    id="input"
                    rows={currentStepData.rows}
                    value={formData[currentStepData.field]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className={`resize-none text-base leading-relaxed transition-all duration-200 ${
                      errors[currentStepData.field] 
                        ? 'border-destructive focus-visible:ring-destructive' 
                        : 'focus-visible:ring-primary'
                    }`}
                    placeholder={currentStepData.placeholder}
                  />
                  {errors[currentStepData.field] && (
                    <motion.p 
                      className="text-sm text-destructive"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors[currentStepData.field]}
                    </motion.p>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className="flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <div className="flex items-center space-x-2">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          step.id === currentStep
                            ? 'bg-primary w-8'
                            : step.id < currentStep
                            ? 'bg-primary/60'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="flex items-center"
                  >
                    {currentStep === steps.length ? (
                      isSubmitting ? (
                        <>
                          <motion.div
                            className="w-4 h-4 mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Sparkles className="w-4 h-4" />
                          </motion.div>
                          Creating Your Pack...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate My Startup Pack
                        </>
                      )
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Deliverables Preview (shown on last step) */}
                {currentStep === steps.length && (
                  <motion.div
                    className="mt-8 pt-8 border-t border-border"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm font-medium text-muted-foreground mb-4 text-center">
                      Your startup pack will include:
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {deliverables.map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                        >
                          <Badge variant="secondary" className="justify-center py-3 px-4 w-full">
                            <item.icon className="w-4 h-4 mr-2" />
                            {item.label}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Keyboard Hint */}
        <motion.p 
          className="text-center text-sm text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Press <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘ + Enter</kbd> to continue
        </motion.p>
      </div>
    </div>
  );
}
