"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CEOBriefFormData {
  problemStatement: string;
  targetUsers: string;
  keyFeatureIdea: string;
}

interface CEOBriefFormProps {
  onSubmit?: (data: CEOBriefFormData) => void;
  className?: string;
}

export default function CEOBriefForm({ onSubmit, className = '' }: CEOBriefFormProps) {
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
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Start Your Startup Journey
          </h1>
          <p className="text-gray-600">
            Tell us about your idea and we&apos;ll create a complete startup kickoff pack
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Problem Statement */}
          <div>
            <label htmlFor="problemStatement" className="block text-sm font-medium text-gray-700 mb-2">
              What problem are you solving? *
            </label>
            <textarea
              id="problemStatement"
              rows={4}
              value={formData.problemStatement}
              onChange={(e) => handleInputChange('problemStatement', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.problemStatement ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe the problem your startup will solve. Be specific about who faces this problem and why current solutions aren&apos;t working..."
            />
            {errors.problemStatement && (
              <p className="mt-1 text-sm text-red-600">{errors.problemStatement}</p>
            )}
          </div>

          {/* Target Users */}
          <div>
            <label htmlFor="targetUsers" className="block text-sm font-medium text-gray-700 mb-2">
              Who are your target users? *
            </label>
            <textarea
              id="targetUsers"
              rows={3}
              value={formData.targetUsers}
              onChange={(e) => handleInputChange('targetUsers', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.targetUsers ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your ideal customers. Include demographics, behaviors, pain points, and what motivates them..."
            />
            {errors.targetUsers && (
              <p className="mt-1 text-sm text-red-600">{errors.targetUsers}</p>
            )}
          </div>

          {/* Key Feature Idea */}
          <div>
            <label htmlFor="keyFeatureIdea" className="block text-sm font-medium text-gray-700 mb-2">
              What&apos;s your key feature idea? *
            </label>
            <textarea
              id="keyFeatureIdea"
              rows={3}
              value={formData.keyFeatureIdea}
              onChange={(e) => handleInputChange('keyFeatureIdea', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.keyFeatureIdea ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Describe your main feature or solution. What makes it unique? How will it solve the problem you identified..."
            />
            {errors.keyFeatureIdea && (
              <p className="mt-1 text-sm text-red-600">{errors.keyFeatureIdea}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Your Startup Pack...
                </div>
              ) : (
                'Generate My Startup Pack'
              )}
            </button>
          </div>
        </form>

        {/* Additional Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">🚀 Your startup pack will include:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-center space-x-1">
                <span>📋</span>
                <span>Product Requirements</span>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <span>📅</span>
                <span>Project Timeline</span>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <span>⚡</span>
                <span>Engineering Plan</span>
              </div>
              <div className="flex items-center justify-center space-x-1">
                <span>📢</span>
                <span>Marketing Strategy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
