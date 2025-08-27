// examples.mts - Example script demonstrating MCP server integration

// Load environment variables from .env file
import "dotenv/config";

import { HumanMessage } from "@langchain/core/messages";
import { app } from "./agent.mts";

async function runExamples() {
    console.log("🤖 Starting LangGraph MCP Examples\n");

    console.log("=== Example 1: Find vegetarian soup recipes ===");
    const example1 = await app.invoke({
        messages: [new HumanMessage("Find me some vegetarian soup recipes")],
    });
    console.log(example1.messages[example1.messages.length - 1].content);
    console.log("\n");

    console.log("=== Example 2: Add ingredients to shopping list ===");
    const example2 = await app.invoke({
        messages: [
            ...example1.messages,
            new HumanMessage(
                "Add the ingredients from one of those recipes to my shopping list",
            ),
        ],
    });
    console.log(example2.messages[example2.messages.length - 1].content);
    console.log("\n");

    console.log("=== Example 3: Check shopping list ===");
    const example3 = await app.invoke({
        messages: [
            ...example2.messages,
            new HumanMessage("What's on my shopping list now?"),
        ],
    });
    console.log(example3.messages[example3.messages.length - 1].content);
    console.log("\n");

    console.log("=== Example 4: Find dessert recipes ===");
    const example4 = await app.invoke({
        messages: [
            ...example3.messages,
            new HumanMessage(
                "I also want to make a dessert. Can you find me some dessert recipes?",
            ),
        ],
    });
    console.log(example4.messages[example4.messages.length - 1].content);
    console.log("\n");

    console.log("=== Example 5: Clear shopping list ===");
    const example5 = await app.invoke({
        messages: [
            ...example4.messages,
            new HumanMessage(
                "Actually, I changed my mind. Please clear my shopping list.",
            ),
        ],
    });
    console.log(example5.messages[example5.messages.length - 1].content);
    console.log("\n");

    console.log("✅ All examples completed!");
}

// Run the examples
runExamples().catch(console.error);
