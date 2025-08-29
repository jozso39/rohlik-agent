// main.mts - Main entry point for the LangGraph MCP Demo

// Load environment variables from .env file
import "dotenv/config";

import { HumanMessage } from "@langchain/core/messages";
import { app } from "./src/agent";

console.log("🤖 RohBot Demo");
console.log("=====================================\n");

async function main() {
    // Simple demonstration
    const result = await app.invoke({
        messages: [
            new HumanMessage(
                "Chci dneska uvařit nějaké dobré masité jídlo. Najdi něco s karlovarským knedlíkem a přidej všechny ingredience do nákupního seznamu",
            ),
        ],
    });

    console.log("🍽️ Agent Response:");
    console.log(result.messages[result.messages.length - 1].content);

    console.log(
        "\n🎯 Chceš použít tohoto agenta interaktivně? Použij: 'npm run chat'",
    );
}

// Run the main function
main().catch(console.error);
