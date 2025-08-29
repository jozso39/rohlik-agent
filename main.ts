import { HumanMessage } from "@langchain/core/messages";
import { app } from "./src/agent.ts";
import { checkMCPServer } from "./src/utils/mcpHealthCheck.ts";

console.log("🤖 RohBot Demo");
console.log("=====================================\n");

async function main() {
    await checkMCPServer();

    const humanMessageText =
        "Chci abys mi vytvořil jídelníček na 3 dny dopředu. vytvoř mi i dokument s tímto plánem. Jsem vegetarian";
    console.log(
        "Tohle je malé demo RohBota (Rohlík asistent pro plánování jídelníčku a správu nákupního seznamu)\n",
    );
    console.log(`User: ${humanMessageText}`);

    const result = await app.invoke({
        messages: [new HumanMessage(humanMessageText)],
    });

    console.log("🍽️ Agent Response:");
    console.log(result.messages[result.messages.length - 1].content);

    console.log(
        "\n🎯 Chceš použít tohoto agenta interaktivně? Použij: 'npm run chat'",
    );
}

main().catch(console.error);
