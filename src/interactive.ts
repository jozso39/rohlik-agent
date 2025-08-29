// interactive.mts - Interactive CLI interface for the LangGraph MCP agent

// Load environment variables from .env file
import "dotenv/config";

import { HumanMessage } from "@langchain/core/messages";
import { app } from "./agent";
import { clearShoppingListTool } from "./tools/mcpTools";
import * as readline from "readline";
import { stdin as input, stdout as output } from "process";

// Create readline interface
const rl = readline.createInterface({
    input,
    output,
    prompt: "👤: ",
});

const goodbyeMessage = "\n👋 Naschledanou! Díky že jste využili RohBota!";

// Store conversation history
let conversationHistory: any[] = [];

console.log(
    "🤖 Rohlík Asistent pro plánování jídelníčku a správu nákupního seznamu (RohBot)",
);
console.log("====================================================");
console.log(
    "💬 Pomůžu ti naplánovat tvůj jídelníček podle exkluzivních rohlíkovských receptů!",
);
console.log("Můžeš mi poroučet například takto:");
console.log("   • 'připrav mi týdenní plán vegetariánských jídel'");
console.log("   • 'přidej mrkev na nákupní seznam'");
console.log("   • 'najdi mi recepty na vegetariánské polévky'");
console.log("   • 'co je na mém nákupním seznamu?'");
console.log("   • 'odstraň vše z nákupního seznamu'");
console.log("   • 'odstraň okurku z nákupního seznamu'");
console.log("📝 Napiš 'KONEC' nebo 'STAČILO' k ukončení programu,");
console.log(
    "nebo 'POMOC' pro nápovědu, nebo 'RESET' pro restart konverzace.\n",
);

// Function to process user input
async function processUserInput(userInput: string) {
    if (
        userInput.toLowerCase().trim() === "konec" ||
        userInput.toLowerCase().trim() === "stačilo"
    ) {
        console.log(goodbyeMessage);
        rl.close();
        return;
    }

    if (
        userInput.toLowerCase().trim() === "reset"
    ) {
        conversationHistory = [];

        // Clear the shopping list as well when clearing conversation
        try {
            await clearShoppingListTool.func({});
            console.log(
                "🧹 Konverzace restartována a nákupní seznam vyčištěn!\n",
            );
        } catch (error) {
            console.log("🧹 Conversation history cleared!");
            console.log(
                "⚠️ Warning: Could not clear shopping list:",
                error instanceof Error ? error.message : "Unknown error",
            );
        }

        rl.prompt();
        return;
    }

    if (userInput.toLowerCase().trim() === "pomoc") {
        console.log("\n🆘 Možnosti:");
        console.log(
            "   • Bavte se přirozeně s agentem, ptejte se na recepty a přípravu jídelníčku nebo o upravení nákupního seznamu.",
        );
        console.log("📝 Napiš 'KONEC' nebo 'STAČILO' k ukončení programu,");
        console.log(
            "nebo 'POMOC' pro nápovědu, nebo 'RESET' pro restart konverzace.\n",
        );
        rl.prompt();
        return;
    }

    if (!userInput.trim()) {
        rl.prompt();
        return;
    }

    try {
        console.log("🤔 Přemýšlím...\n");

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
    console.log(goodbyeMessage);
    process.exit(0);
});

// Start the interactive session
rl.prompt();
