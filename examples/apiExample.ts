// Example usage of the /api/start-session endpoint

// Example 1: Basic API call
export async function startSessionExample() {
  const projectBrief = {
    companyName: "FoodieConnect",
    industry: "Food Delivery",
    problemStatement: "College students struggle to find affordable, healthy meals that fit their busy schedules and limited budgets.",
    targetUsers: "College students aged 18-24 who live on or near campus",
    timeline: "2 weeks MVP, 3 months full launch",
    budget: "$25k bootstrap funding",
    additionalContext: "Focus on local restaurants near universities, emphasize speed and affordability"
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
      console.log('Session started successfully!');
      console.log('Session ID:', result.sessionId);
      console.log('Total messages:', result.data.summary.totalMessages);
      console.log('Total artifacts:', result.data.summary.totalArtifacts);
      console.log('Participating agents:', result.data.summary.participatingAgents);
      
      return result;
    } else {
      console.error('Session failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('API call failed:', error);
    return null;
  }
}

// Example 2: Retrieve existing session
export async function getSessionExample(sessionId: string) {
  try {
    const response = await fetch(`/api/start-session?sessionId=${sessionId}`);
    const result = await response.json();

    if (result.success) {
      console.log('Session retrieved successfully!');
      return result.data;
    } else {
      console.error('Failed to retrieve session:', result.error);
      return null;
    }
  } catch (error) {
    console.error('API call failed:', error);
    return null;
  }
}

// Example 3: Client-side React hook for session management
export function useStartupSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startSession = async (projectBrief: any) => {
    setLoading(true);
    setError(null);

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
        setSession(result);
        return result;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/start-session?sessionId=${sessionId}`);
      const result = await response.json();

      if (result.success) {
        setSession(result);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    session,
    loading,
    error,
    startSession,
    getSession
  };
}

// Example 4: Error handling scenarios
export async function testErrorHandling() {
  console.log('=== Testing Error Handling ===');

  // Test 1: Invalid JSON
  try {
    const response = await fetch('/api/start-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: 'invalid json'
    });
    const result = await response.json();
    console.log('Invalid JSON test:', result);
  } catch (error) {
    console.log('Expected error for invalid JSON');
  }

  // Test 2: Missing required fields
  try {
    const response = await fetch('/api/start-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyName: "Test",
        // Missing other required fields
      })
    });
    const result = await response.json();
    console.log('Missing fields test:', result);
  } catch (error) {
    console.log('Error with missing fields:', error);
  }

  // Test 3: Retrieve non-existent session
  try {
    const response = await fetch('/api/start-session?sessionId=nonexistent');
    const result = await response.json();
    console.log('Non-existent session test:', result);
  } catch (error) {
    console.log('Error retrieving non-existent session:', error);
  }
}

// Example 5: Full workflow demonstration
export async function fullWorkflowExample() {
  console.log('=== Full Workflow Example ===');

  const projectBrief = {
    companyName: "EcoRide",
    industry: "Transportation",
    problemStatement: "Urban commuters need sustainable, affordable transportation options that reduce carbon footprint.",
    targetUsers: "Urban professionals aged 25-45 who commute daily",
    timeline: "3 weeks MVP, 4 months launch",
    budget: "$50k seed funding"
  };

  // Step 1: Start session
  console.log('1. Starting session...');
  const sessionResult = await startSessionExample();
  
  if (!sessionResult) {
    console.log('Failed to start session');
    return;
  }

  const sessionId = sessionResult.sessionId;
  console.log(`Session created: ${sessionId}`);

  // Step 2: Retrieve session
  console.log('2. Retrieving session...');
  const retrievedSession = await getSessionExample(sessionId);
  
  if (retrievedSession) {
    console.log('Session retrieved successfully');
    
    // Step 3: Process artifacts
    console.log('3. Processing artifacts...');
    Object.values(retrievedSession.artifacts).forEach((artifact: any) => {
      console.log(`- ${artifact.title} (${artifact.type}) by ${artifact.agentName}`);
    });

    // Step 4: Display conversation
    console.log('4. Conversation summary:');
    retrievedSession.conversation.forEach((msg: any, index: number) => {
      console.log(`${index + 1}. ${msg.agentName}: ${msg.content.substring(0, 100)}...`);
    });
  }

  return { sessionId, sessionResult, retrievedSession };
}

// Usage examples (uncomment to test):
// startSessionExample();
// testErrorHandling();
// fullWorkflowExample();
