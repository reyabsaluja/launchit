import { runConversation, exportConversationToMarkdown, getArtifactsByType } from '../lib/orchestrator';

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

// Example 1: Basic conversation orchestration
export async function basicOrchestrationExample() {
  console.log("=== Running Full Agent Conversation ===");
  
  try {
    const result = await runConversation(sampleProjectBrief);
    
    console.log("\n--- Conversation Summary ---");
    console.log(`Total Messages: ${result.summary.totalMessages}`);
    console.log(`Total Artifacts: ${result.summary.totalArtifacts}`);
    console.log(`Participating Agents: ${result.summary.participatingAgents.join(', ')}`);
    console.log(`Duration: ${result.summary.duration}ms`);
    
    console.log("\n--- Conversation Messages ---");
    result.conversation.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg.agentName} (${msg.role}):`);
      console.log(`   ${msg.content.substring(0, 100)}...`);
      if (msg.hasArtifact) {
        console.log(`   📄 Generated ${msg.artifactType}`);
      }
      console.log("");
    });
    
    console.log("\n--- Generated Artifacts ---");
    Object.values(result.artifacts).forEach(artifact => {
      console.log(`- ${artifact.title} (${artifact.type}) by ${artifact.agentName}`);
    });
    
    return result;
    
  } catch (error) {
    console.error("Orchestration failed:", error);
    throw error;
  }
}

// Example 2: Extract specific artifacts
export async function extractArtifactsExample() {
  console.log("=== Extracting Specific Artifacts ===");
  
  const result = await runConversation(sampleProjectBrief);
  
  // Get PRD artifacts
  const prdArtifacts = getArtifactsByType(result.artifacts, 'PRD');
  console.log(`Found ${prdArtifacts.length} PRD artifacts:`);
  prdArtifacts.forEach(artifact => {
    console.log(`- ${artifact.title}`);
    console.log(`  Content preview: ${artifact.content.substring(0, 200)}...`);
  });
  
  // Get Engineering artifacts
  const engineeringArtifacts = getArtifactsByType(result.artifacts, 'Engineering');
  console.log(`\nFound ${engineeringArtifacts.length} Engineering artifacts:`);
  engineeringArtifacts.forEach(artifact => {
    console.log(`- ${artifact.title}`);
  });
  
  return { prdArtifacts, engineeringArtifacts };
}

// Example 3: Export to markdown
export async function exportExample() {
  console.log("=== Exporting Conversation to Markdown ===");
  
  const result = await runConversation(sampleProjectBrief);
  const markdown = exportConversationToMarkdown(result, sampleProjectBrief);
  
  console.log("Markdown export preview:");
  console.log(markdown.substring(0, 500) + "...");
  
  // In a real app, you might save this to a file or return it to the client
  return markdown;
}

// Example 4: Error handling
export async function errorHandlingExample() {
  console.log("=== Error Handling Example ===");
  
  // Example with invalid project brief
  const invalidBrief = {
    companyName: "",
    industry: "",
    problemStatement: "",
    targetUsers: "",
    timeline: "",
    budget: ""
  };
  
  try {
    const result = await runConversation(invalidBrief);
    console.log("Conversation completed despite minimal input");
    return result;
  } catch (error) {
    console.error("Expected error occurred:", error);
    return null;
  }
}

// Example 5: Real-time progress tracking
export async function progressTrackingExample() {
  console.log("=== Progress Tracking Example ===");
  
  // This would be useful for updating a UI in real-time
  const originalConsoleLog = console.log;
  const progressUpdates: string[] = [];
  
  console.log = (...args) => {
    const message = args.join(' ');
    progressUpdates.push(message);
    originalConsoleLog(...args);
  };
  
  try {
    const result = await runConversation(sampleProjectBrief);
    
    console.log = originalConsoleLog; // Restore original console.log
    
    console.log("\n--- Progress Updates Captured ---");
    progressUpdates.forEach((update, index) => {
      console.log(`${index + 1}. ${update}`);
    });
    
    return { result, progressUpdates };
    
  } catch (error) {
    console.log = originalConsoleLog; // Restore on error too
    throw error;
  }
}

// Run examples (uncomment to test)
// basicOrchestrationExample();
// extractArtifactsExample();
// exportExample();
// errorHandlingExample();
// progressTrackingExample();
