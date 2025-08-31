import { HumanMessage } from "@langchain/core/messages";
import { app } from "./src/agent.ts";
import { checkMCPServer } from "./src/utils/mcpHealthCheck.ts";
import { loadEnv } from "./src/utils/loadEnv.ts";

console.log("🤖 RohBot Demo");
console.log("=====================================\n");

async function main() {
    // Load environment variables from .env file if it exists
    await loadEnv();

    const MCP_BASE_URL = Deno.env.get("MCP_BASE_URL") ||
        "http://localhost:8001";
    await checkMCPServer(MCP_BASE_URL);

    const humanMessageText =
        "Chci abys mi vytvořil jídelníček na 3 dny dopředu. vytvoř mi i dokument s tímto plánem. Jsem vegetarian";
    console.log(
        "Tohle je malé demo RohBota (Rohlík asistent pro plánování jídelníčku a správu nákupního seznamu)\n",
    );
    console.log(`User: ${humanMessageText}`);

    console.log("\n🎬 Streaming agent response...\n");

    // Use streamEvents for token-level streaming
    const eventStream = app.streamEvents({
        messages: [new HumanMessage(humanMessageText)],
    }, { version: "v2" });

    let isStreamingContent = false;
    let currentContent = "";

    for await (const event of eventStream) {
        // Handle LLM token streaming
        if (
            event.event === "on_chat_model_stream" && event.data?.chunk?.content
        ) {
            if (!isStreamingContent) {
                console.log("🤖 Agent:");
                isStreamingContent = true;
            }
            // Stream tokens character by character
            const token = event.data.chunk.content;
            currentContent += token;
            Deno.stdout.writeSync(new TextEncoder().encode(token));
        }

        // Handle tool calls
        if (event.event === "on_tool_start") {
            if (isStreamingContent) {
                console.log("\n"); // New line after content
                isStreamingContent = false;
            }
            console.log(`🔧 Používám nástroj: ${event.name}`);
        }

        // Handle tool results
        if (event.event === "on_tool_end") {
            console.log(`✅ Nástroj ${event.name} dokončen`);
        }
    }

    if (isStreamingContent) {
        console.log("\n"); // Final new line
    }

    console.log(
        "\n🎯 Chceš použít tohoto agenta interaktivně? Použij: 'npm run chat'",
    );
}

main().catch(console.error);
