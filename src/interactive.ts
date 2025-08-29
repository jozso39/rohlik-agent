// interactive.ts - Interactive CLI interface for the LangGraph MCP agent

import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { app } from "./agent.ts";
import { clearShoppingListTool } from "./tools/mcpTools.ts";
import { checkMCPServer } from "./utils/mcpHealthCheck.ts";

const goodbyeMessage =
    "\n👋 Naschledanou! Váš nákupní seznam byl vyčištěn. Díky že jste využili RohBota!";

// Store conversation history
let conversationHistory: BaseMessage[] = [];

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

async function cleanShopingList() {
    try {
        await clearShoppingListTool.func({});
    } catch (error) {
        console.log(
            "⚠️ Warning: Could not clear shopping list:",
            error instanceof Error ? error.message : "Unknown error",
        );
    }
}

// Function to read user input from stdin
async function readInput(): Promise<string> {
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(1024);

    Deno.stdout.write(new TextEncoder().encode("👤: "));
    const n = await Deno.stdin.read(buffer);

    if (n === null) {
        return "";
    }

    return decoder.decode(buffer.subarray(0, n)).trim();
}

// Function to process user input
async function processUserInput(userInput: string) {
    if (
        userInput.toLowerCase().trim() === "konec" ||
        userInput.toLowerCase().trim() === "stačilo"
    ) {
        await cleanShopingList();
        console.log(goodbyeMessage);
        Deno.exit(0);
    }

    if (userInput.toLowerCase().trim() === "reset") {
        conversationHistory = [];
        await cleanShopingList();
        console.log("🧹 Konverzace restartována a nákupní seznam vyčištěn.");
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
        return;
    }

    if (!userInput.trim()) {
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
}

async function startInteractiveSession() {
    await checkMCPServer();

    // Handle Ctrl+C gracefully
    Deno.addSignalListener("SIGINT", async () => {
        console.log(goodbyeMessage);
        await cleanShopingList();
        Deno.exit(0);
    });

    // Main input loop
    while (true) {
        try {
            const input = await readInput();
            await processUserInput(input);
        } catch (error) {
            if (error instanceof Deno.errors.Interrupted) {
                console.log(goodbyeMessage);
                await cleanShopingList();
                Deno.exit(0);
            }
            console.error("Error reading input:", error);
        }
    }
}

startInteractiveSession();
