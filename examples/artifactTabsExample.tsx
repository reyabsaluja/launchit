"use client";

import { useState } from "react";
import ArtifactTabs from "@/components/ArtifactTabs";
import { Artifact } from "@/lib/orchestrator";

// Mock artifacts for demonstration
const mockArtifacts: Record<string, Artifact> = {
  "artifact_pm_1": {
    id: "artifact_pm_1",
    type: "PRD",
    title: "Product Requirements Document",
    content: `# FoodieConnect - Product Requirements Document

## Problem Statement
College students struggle to find affordable, healthy meals that fit their busy schedules and limited budgets. Current food delivery options are either too expensive or offer poor quality food.

## Target Users
- Primary: College students aged 18-24 living on or near campus
- Secondary: Graduate students and young professionals in university areas
- Demographics: Budget-conscious, tech-savvy, health-aware

## Core Features
### MVP Features
1. **User Authentication**
   - Email/phone registration
   - Social login (Google, Apple)
   - Student verification system

2. **Restaurant Discovery**
   - Local restaurant catalog
   - Filter by price, cuisine, dietary restrictions
   - Student discount indicators

3. **Ordering System**
   - Simple cart functionality
   - Group ordering for dorms/study groups
   - Scheduled ordering for meal planning

4. **Payment Integration**
   - Student-friendly payment options
   - Split payment for group orders
   - Campus meal plan integration

## Success Metrics
- 100 signups in first week
- 70% user activation rate (complete first order)
- Average order value: $12-15
- Customer retention: 40% weekly active users

## Timeline
- Week 1-2: MVP development
- Week 3-4: Beta testing with select universities
- Month 2-3: Full launch and scaling`,
    agentId: "product_manager",
    agentName: "Alex Chen",
    timestamp: new Date(Date.now() - 180000)
  },
  "artifact_eng_1": {
    id: "artifact_eng_1", 
    type: "Engineering",
    title: "Technical Architecture & Implementation Plan",
    content: `# Technical Architecture

## Tech Stack
- **Frontend**: React/Next.js with TypeScript
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT
- **Payments**: Stripe API
- **Deployment**: Vercel (Frontend) + Railway (Backend)
- **Monitoring**: Sentry for error tracking

## System Architecture
### Frontend (Next.js)
- Server-side rendering for SEO
- Progressive Web App capabilities
- Responsive design for mobile-first experience
- Real-time order tracking with WebSockets

### Backend (Node.js/Express)
- RESTful API design
- JWT-based authentication
- Rate limiting and security middleware
- Integration with restaurant POS systems

### Database Schema
- Users (students, restaurants, delivery)
- Restaurants & Menus
- Orders & Order Items
- Payments & Transactions
- Reviews & Ratings

## Implementation Tasks
### Phase 1 (Week 1)
1. Project setup and configuration
2. Database schema design and migration
3. Authentication system implementation
4. Basic restaurant catalog API

### Phase 2 (Week 2)
5. Order management system
6. Payment integration (Stripe)
7. Frontend components and pages
8. Testing and deployment pipeline

## Security Considerations
- Input validation and sanitization
- SQL injection prevention
- Rate limiting on API endpoints
- Secure payment handling (PCI compliance)
- Student verification system

## Performance Targets
- Page load time: <2 seconds
- API response time: <500ms
- 99.9% uptime
- Support for 1000+ concurrent users`,
    agentId: "senior_engineer",
    agentName: "Jordan Kim", 
    timestamp: new Date(Date.now() - 120000)
  },
  "artifact_projm_1": {
    id: "artifact_projm_1",
    type: "Timeline",
    title: "Project Timeline & Risk Management",
    content: `# Project Timeline

## Phase 1: Foundation (Week 1)
### Days 1-2: Project Setup
- Repository setup and CI/CD pipeline
- Development environment configuration
- Database design and initial migration
- Team onboarding and tool setup

### Days 3-4: Core Backend
- Authentication system implementation
- Restaurant API development
- Database models and relationships
- Basic API testing

### Days 5-7: Frontend Foundation
- Next.js project setup
- Authentication UI components
- Restaurant listing pages
- Basic responsive design

## Phase 2: Core Features (Week 2)
### Days 8-10: Ordering System
- Shopping cart functionality
- Order placement and management
- Payment integration (Stripe)
- Order status tracking

### Days 11-12: Integration & Testing
- Frontend-backend integration
- End-to-end testing
- Performance optimization
- Bug fixes and refinements

### Days 13-14: Launch Preparation
- Production deployment
- Final testing and QA
- Documentation and handover
- Soft launch with beta users

## Risk Management
### High-Risk Items
1. **Payment Integration Complexity**
   - Risk: Stripe integration delays
   - Mitigation: Start payment work early, have backup simple payment flow
   - Owner: Engineering team

2. **Restaurant Data Acquisition**
   - Risk: Difficulty getting restaurant partnerships
   - Mitigation: Start with 5-10 partner restaurants, manual menu entry
   - Owner: Business development

3. **Student Verification System**
   - Risk: Complex verification requirements
   - Mitigation: Start with email domain verification, enhance later
   - Owner: Product team

### Dependencies
- Restaurant partnership agreements (External)
- Stripe merchant account approval (External)
- University email domain access (External)
- Mobile app store approvals (if needed)

## Budget Allocation
- Development team: $30k (60%)
- Infrastructure & tools: $10k (20%)
- Marketing & launch: $7k (14%)
- Contingency: $3k (6%)
- Total: $50k

## Success Criteria
- All MVP features functional
- <2 second page load times
- Payment processing working
- 10+ restaurants onboarded
- Ready for beta user testing`,
    agentId: "project_manager",
    agentName: "Sam Taylor",
    timestamp: new Date(Date.now() - 60000)
  },
  "artifact_marketing_1": {
    id: "artifact_marketing_1",
    type: "Marketing", 
    title: "Marketing Strategy & Brand Assets",
    content: `# Marketing Strategy

## Brand Positioning
**Tagline**: "FoodieConnect - Healthy meals, student prices. Made by students, for students."

**Value Proposition**: The only food delivery app designed specifically for college students, offering healthy, affordable meals with student discounts and group ordering features.

## Target Audience
### Primary Segment
- College students (18-24)
- Budget: $20-50/week for food delivery
- Health-conscious but convenience-driven
- Social media active (Instagram, TikTok, Snapchat)

### Messaging Pillars
1. **Affordability**: "Student-friendly prices that won't break your budget"
2. **Health**: "Nutritious options that fuel your studies"
3. **Convenience**: "Order with friends, delivered to your dorm"
4. **Community**: "Built by students who get it"

## Landing Page Copy
### Hero Section
**Headline**: "Healthy Meals, Student Prices"
**Subheadline**: "The food delivery app made for college life. Group orders, student discounts, and healthy options delivered right to your dorm."
**CTA**: "Order Your First Meal Free"

### Key Benefits
- 🎓 **Student Discounts**: Save 15-30% at partner restaurants
- 👥 **Group Ordering**: Split costs with roommates and friends  
- 🥗 **Healthy Options**: Nutritious meals that keep you energized
- 📱 **Campus Delivery**: Direct to dorms, libraries, and study spots

### Social Proof
- "Join 1,000+ students already saving on healthy meals"
- Student testimonials and reviews
- University partnership badges

## Launch Strategy
### Pre-Launch (2 weeks before)
- Instagram and TikTok teasers
- Campus ambassador program
- Email list building with early access
- Partnership announcements

### Launch Week
- Free delivery for first 100 orders
- Social media contest (#FoodieConnectChallenge)
- Campus flyering and table setup
- Influencer partnerships with student food bloggers

### Post-Launch (Month 1)
- Referral program (free meal for each friend)
- User-generated content campaigns
- Campus event sponsorships
- Email marketing automation

## Visual Identity
### Brand Colors
- Primary: Fresh Green (#4CAF50)
- Secondary: University Blue (#2196F3)
- Accent: Warm Orange (#FF9800)

### Design Style
- Clean, modern interface
- Student-friendly and approachable
- Mobile-first design
- High-contrast for accessibility

## Success Metrics
### Acquisition
- Landing page conversion: >5%
- Social media engagement: >3%
- Cost per acquisition: <$15

### Retention
- Week 1 retention: >60%
- Monthly active users: >40%
- Net Promoter Score: >50

## Budget Allocation ($7k)
- Social media advertising: $3k (43%)
- Campus marketing materials: $1.5k (21%)
- Influencer partnerships: $1.5k (21%)
- Content creation: $1k (15%)`,
    agentId: "marketing_lead",
    agentName: "Riley Morgan",
    timestamp: new Date(Date.now() - 30000)
  }
};

// Example 1: Basic ArtifactTabs usage
export function BasicArtifactTabsExample() {
  const [artifacts, setArtifacts] = useState(mockArtifacts);

  const handleArtifactUpdate = (artifactId: string, newContent: string) => {
    setArtifacts(prev => ({
      ...prev,
      [artifactId]: {
        ...prev[artifactId],
        content: newContent
      }
    }));
    console.log(`Updated artifact ${artifactId}`);
  };

  return (
    <div className="h-96 border border-gray-200 rounded-lg">
      <ArtifactTabs 
        artifacts={artifacts}
        onArtifactUpdate={handleArtifactUpdate}
      />
    </div>
  );
}

// Example 2: Empty state (no artifacts)
export function EmptyArtifactTabsExample() {
  return (
    <div className="h-96 border border-gray-200 rounded-lg">
      <ArtifactTabs artifacts={} />
    </div>
  );
}

// Example 3: Partial artifacts (only some tabs have content)
export function PartialArtifactTabsExample() {
  const partialArtifacts = {
    "artifact_pm_1": mockArtifacts["artifact_pm_1"],
    "artifact_eng_1": mockArtifacts["artifact_eng_1"]
  };

  return (
    <div className="h-96 border border-gray-200 rounded-lg">
      <ArtifactTabs artifacts={partialArtifacts} />
    </div>
  );
}

// Example 4: Full-screen artifact viewer
export function FullScreenArtifactExample() {
  const [artifacts, setArtifacts] = useState(mockArtifacts);

  const handleArtifactUpdate = (artifactId: string, newContent: string) => {
    setArtifacts(prev => ({
      ...prev,
      [artifactId]: {
        ...prev[artifactId],
        content: newContent
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-100">
      <div className="h-full max-w-6xl mx-auto bg-white shadow-lg">
        <ArtifactTabs 
          artifacts={artifacts}
          onArtifactUpdate={handleArtifactUpdate}
          className="h-full"
        />
      </div>
    </div>
  );
}

// Example 5: Integration with API data
export function ApiIntegratedArtifactExample() {
  const [artifacts, setArtifacts] = useState<Record<string, Artifact>>({});
  const [loading, setLoading] = useState(false);

  const loadArtifactsFromSession = async (sessionId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/start-session?sessionId=${sessionId}`);
      const result = await response.json();
      
      if (result.success) {
        setArtifacts(result.data.artifacts);
      }
    } catch (error) {
      console.error('Failed to load artifacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArtifactUpdate = (artifactId: string, newContent: string) => {
    setArtifacts(prev => ({
      ...prev,
      [artifactId]: {
        ...prev[artifactId],
        content: newContent
      }
    }));
    
    // In a real app, you might want to save changes to the server
    console.log(`Artifact ${artifactId} updated`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => loadArtifactsFromSession('demo-session')}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Load from Session'}
        </button>
        <span className="text-sm text-gray-600">
          {Object.keys(artifacts).length} artifacts loaded
        </span>
      </div>
      
      <div className="h-96 border border-gray-200 rounded-lg">
        <ArtifactTabs 
          artifacts={artifacts}
          onArtifactUpdate={handleArtifactUpdate}
        />
      </div>
    </div>
  );
}

// Main demo component
export default function ArtifactTabsDemo() {
  const [activeExample, setActiveExample] = useState<string>("basic");

  const examples = {
    basic: { component: <BasicArtifactTabsExample />, title: "Basic Artifact Tabs" },
    empty: { component: <EmptyArtifactTabsExample />, title: "Empty State" },
    partial: { component: <PartialArtifactTabsExample />, title: "Partial Artifacts" },
    api: { component: <ApiIntegratedArtifactExample />, title: "API Integration" }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ArtifactTabs Component Examples
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
