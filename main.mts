// main.mts - Main entry point for the LangGraph MCP Demo

// Load environment variables from .env file
import "dotenv/config";

import { HumanMessage } from "@langchain/core/messages";
import { app } from "./src/agent.mts";

console.log("🤖 LangGraph MCP Shopping Assistant");
console.log("=====================================\n");

// Simple demonstration
const result = await app.invoke({
    messages: [
        new HumanMessage(
            "I want to cook something vegetarian tonight. Can you help me find a vegetarian recipe and add the ingredients to my shopping list?",
        ),
    ],
});

console.log("🍽️ Agent Response:");
console.log(result.messages[result.messages.length - 1].content);

console.log("\n🎯 Want to chat interactively? Run: npm run chat");
console.log("📝 For more examples, run: npm run examples");
