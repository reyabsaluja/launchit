"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, FileText, Calendar, Zap, Megaphone } from 'lucide-react';

interface CEOBriefFormData {
  problemStatement: string;
  targetUsers: string;
  keyFeatureIdea: string;
}

interface CEOBriefFormProps {
  onSubmit?: (data: CEOBriefFormData) => void;
  className?: string;
}

export default function CEOBriefForm({ onSubmit }: CEOBriefFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CEOBriefFormData>({
    problemStatement: '',
    targetUsers: '',
    keyFeatureIdea: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<CEOBriefFormData>>({});

  const handleInputChange = (field: keyof CEOBriefFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CEOBriefFormData> = {};
    
    if (!formData.problemStatement.trim()) {
      newErrors.problemStatement = 'Problem statement is required';
    } else if (formData.problemStatement.trim().length < 10) {
      newErrors.problemStatement = 'Problem statement should be at least 10 characters';
    }
    
    if (!formData.targetUsers.trim()) {
      newErrors.targetUsers = 'Target users description is required';
    } else if (formData.targetUsers.trim().length < 5) {
      newErrors.targetUsers = 'Target users should be at least 5 characters';
    }
    
    if (!formData.keyFeatureIdea.trim()) {
      newErrors.keyFeatureIdea = 'Key feature idea is required';
    } else if (formData.keyFeatureIdea.trim().length < 5) {
      newErrors.keyFeatureIdea = 'Key feature idea should be at least 5 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Call custom onSubmit if provided
      if (onSubmit) {
        onSubmit(formData);
      }
      
      // POST to API
      const response = await fetch('/api/start-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: 'New Startup', // Default name, could be made configurable
          industry: 'Technology', // Default industry, could be made configurable
          problemStatement: formData.problemStatement,
          targetUsers: formData.targetUsers,
          keyFeatureIdea: formData.keyFeatureIdea,
          timeline: '2-3 months', // Default timeline
          budget: '$50,000' // Default budget
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Navigate to session page with session ID
        router.push(`/session?id=${result.sessionId}`);
      } else {
        throw new Error(result.error || 'Failed to start session');
      }
      
    } catch (error) {
      console.error('Error submitting form:', error);
      // You might want to show an error message to the user here
      alert('Failed to start session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Startup Planning
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
            Transform Your Idea
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Get a complete startup kickoff pack in minutes. Our AI agents will create your PRD, timeline, engineering plan, and marketing strategy.
          </p>
        </div>

        <Card className="max-w-2xl mx-auto border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold">Start Your Journey</CardTitle>
            <CardDescription className="text-base">
              Tell us about your startup idea and let our AI agents do the rest
            </CardDescription>
          </CardHeader>
          <CardContent>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Problem Statement */}
              <div className="space-y-2">
                <Label htmlFor="problemStatement" className="text-sm font-medium">
                  What problem are you solving? *
                </Label>
                <Textarea
                  id="problemStatement"
                  rows={4}
                  value={formData.problemStatement}
                  onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                  className={`resize-none transition-colors ${
                    errors.problemStatement ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  placeholder="Describe the problem your startup will solve. Be specific about who faces this problem and why current solutions aren't working..."
                />
                {errors.problemStatement && (
                  <p className="text-sm text-destructive">{errors.problemStatement}</p>
                )}
              </div>

              {/* Target Users */}
              <div className="space-y-2">
                <Label htmlFor="targetUsers" className="text-sm font-medium">
                  Who are your target users? *
                </Label>
                <Textarea
                  id="targetUsers"
                  rows={3}
                  value={formData.targetUsers}
                  onChange={(e) => handleInputChange('targetUsers', e.target.value)}
                  className={`resize-none transition-colors ${
                    errors.targetUsers ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  placeholder="Describe your ideal customers. Include demographics, behaviors, pain points, and what motivates them..."
                />
                {errors.targetUsers && (
                  <p className="text-sm text-destructive">{errors.targetUsers}</p>
                )}
              </div>

              {/* Key Feature Idea */}
              <div className="space-y-2">
                <Label htmlFor="keyFeatureIdea" className="text-sm font-medium">
                  What&apos;s your key feature idea? *
                </Label>
                <Textarea
                  id="keyFeatureIdea"
                  rows={3}
                  value={formData.keyFeatureIdea}
                  onChange={(e) => handleInputChange('keyFeatureIdea', e.target.value)}
                  className={`resize-none transition-colors ${
                    errors.keyFeatureIdea ? 'border-destructive focus-visible:ring-destructive' : ''
                  }`}
                  placeholder="Describe your main feature or solution. What makes it unique? How will it solve the problem you identified..."
                />
                {errors.keyFeatureIdea && (
                  <p className="text-sm text-destructive">{errors.keyFeatureIdea}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Your Startup Pack...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate My Startup Pack
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* What You'll Get */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-muted-foreground mb-4">Your startup pack will include:</p>
                <div className="grid grid-cols-2 gap-3">
                  <Badge variant="secondary" className="justify-center py-2 px-3">
                    <FileText className="w-4 h-4 mr-2" />
                    Product Requirements
                  </Badge>
                  <Badge variant="secondary" className="justify-center py-2 px-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    Project Timeline
                  </Badge>
                  <Badge variant="secondary" className="justify-center py-2 px-3">
                    <Zap className="w-4 h-4 mr-2" />
                    Engineering Plan
                  </Badge>
                  <Badge variant="secondary" className="justify-center py-2 px-3">
                    <Megaphone className="w-4 h-4 mr-2" />
                    Marketing Strategy
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
