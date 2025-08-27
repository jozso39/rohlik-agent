// interactive.mts - Interactive CLI interface for the LangGraph MCP agent

// Load environment variables from .env file
import "dotenv/config";

import { HumanMessage } from "@langchain/core/messages";
import { app } from "./agent.mts";
import * as readline from "readline";
import { stdin as input, stdout as output } from "process";

// Create readline interface
const rl = readline.createInterface({
    input,
    output,
    prompt: "🤖 You: ",
});

// Store conversation history
let conversationHistory: any[] = [];

console.log("🤖 LangGraph MCP Shopping Assistant - Interactive Mode");
console.log("====================================================");
console.log("💬 Chat with the agent! Examples:");
console.log("   • 'add mrkev to the shopping cart'");
console.log("   • 'get me a few gluten-free polívka recipes'");
console.log("   • 'what's on my shopping list?'");
console.log("   • 'clear my shopping list'");
console.log("   • 'find vegetarian dessert recipes'");
console.log("📝 Type 'exit' or 'quit' to stop\n");

// Function to process user input
async function processUserInput(userInput: string) {
    if (
        userInput.toLowerCase().trim() === "exit" ||
        userInput.toLowerCase().trim() === "quit"
    ) {
        console.log("👋 Goodbye! Thanks for using the MCP Shopping Assistant!");
        rl.close();
        return;
    }

    if (
        userInput.toLowerCase().trim() === "clear" ||
        userInput.toLowerCase().trim() === "reset"
    ) {
        conversationHistory = [];
        console.log("🧹 Conversation history cleared!\n");
        rl.prompt();
        return;
    }

    if (userInput.toLowerCase().trim() === "help") {
        console.log("\n🆘 Available commands:");
        console.log(
            "   • Chat naturally with the agent about recipes and shopping",
        );
        console.log("   • 'clear' or 'reset' - Clear conversation history");
        console.log("   • 'exit' or 'quit' - Exit the application");
        console.log("   • 'help' - Show this help message\n");
        rl.prompt();
        return;
    }

    if (!userInput.trim()) {
        rl.prompt();
        return;
    }

    try {
        console.log("🤔 Thinking...\n");

        // Add user message to history
        const userMessage = new HumanMessage(userInput);
        const messages = [...conversationHistory, userMessage];

        // Get response from agent
        const result = await app.invoke({ messages });

        // Update conversation history
        conversationHistory = result.messages;

        // Display agent response
        const agentResponse =
            result.messages[result.messages.length - 1].content;
        console.log("🤖 Agent:", agentResponse);
        console.log(); // Empty line for better readability
    } catch (error) {
        console.error(
            "❌ Error:",
            error instanceof Error ? error.message : "Unknown error",
        );
        console.log(); // Empty line for better readability
    }

    rl.prompt();
}

// Handle user input
rl.on("line", (input) => {
    processUserInput(input);
});

// Handle Ctrl+C
rl.on("SIGINT", () => {
    console.log("\n👋 Goodbye! Thanks for using the MCP Shopping Assistant!");
    process.exit(0);
});

// Start the interactive session
rl.prompt();
