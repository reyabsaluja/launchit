import { createAgent, demonstrateProductManagerAgent, getAgentConfig } from '../lib/agentFactory';

// Example project brief
const sampleProjectBrief = {
  companyName: "FoodieConnect",
  industry: "Food Delivery",
  problemStatement: "College students struggle to find affordable, healthy meals that fit their busy schedules and limited budgets.",
  targetUsers: "College students aged 18-24 who live on or near campus",
  timeline: "2 weeks MVP, 3 months full launch",
  budget: "$25k bootstrap funding",
  additionalContext: "Focus on local restaurants near universities, emphasize speed and affordability"
};

// Example 1: Basic agent instantiation
export async function basicProductManagerExample() {
  console.log("=== Basic Product Manager Agent Example ===");
  
  // Get agent configuration
  const pmConfig = getAgentConfig('product_manager');
  console.log(`Creating agent: ${pmConfig.name} (${pmConfig.role})`);
  
  // Create the agent
  const pmAgent = createAgent('product_manager', sampleProjectBrief);
  
  // Send a message to the agent
  const response = await pmAgent.call({
    input: "What should be our MVP features for FoodieConnect?"
  });
  
  console.log("PM Response:", response.text);
  return response.text;
}

// Example 2: Using the demonstration function
export async function demonstrationExample() {
  console.log("=== Product Manager Demonstration ===");
  
  const response = await demonstrateProductManagerAgent(sampleProjectBrief);
  return response;
}

// Example 3: Multi-turn conversation
export async function multiTurnConversation() {
  console.log("=== Multi-turn Conversation Example ===");
  
  const pmAgent = createAgent('product_manager', sampleProjectBrief);
  
  // First message
  const response1 = await pmAgent.call({
    input: "We're starting the planning session for FoodieConnect. What's your initial assessment?"
  });
  console.log("Turn 1 - PM:", response1.text);
  
  // Follow-up message
  const response2 = await pmAgent.call({
    input: "The engineering team is concerned about the timeline. How should we prioritize features?"
  });
  console.log("Turn 2 - PM:", response2.text);
  
  return { response1: response1.text, response2: response2.text };
}

// Example 4: Requesting specific deliverables
export async function requestDeliverables() {
  console.log("=== Requesting Deliverables Example ===");
  
  const pmAgent = createAgent('product_manager', sampleProjectBrief);
  
  const response = await pmAgent.call({
    input: "Can you draft the PRD for FoodieConnect? Include the problem statement, target users, key features, and success metrics."
  });
  
  console.log("PM PRD Draft:", response.text);
  return response.text;
}

// Run examples (uncomment to test)
// basicProductManagerExample();
// demonstrationExample();
// multiTurnConversation();
// requestDeliverables();
