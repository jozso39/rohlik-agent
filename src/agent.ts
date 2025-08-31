// agent.ts - Main LangGraph agent with MCP tools integration

import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { mcpTools } from "./tools/mcpTools.ts";

// Define the tools for the agent to use - only MCP tools for recipe focus
const tools = [...mcpTools];
const toolNode = new ToolNode(tools);

const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
    streaming: true, // Enable streaming
}).bindTools(tools);

/**
 * Determines the next action based on the last message in the conversation.
 *
 * If the last message contains tool calls, returns "tools" to indicate that tool processing should continue.
 * Otherwise, returns "__end__" to signal the end of the process.
 *
 * @param {MessagesAnnotation.State} param0 - An object containing the array of messages.
 * @returns {"tools" | "__end__"} - The next action to take.
 */
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
    const lastMessage = messages[messages.length - 1] as AIMessage;

    if (lastMessage.tool_calls?.length) {
        return "tools";
    }
    return "__end__";
}

const systemMessageText =
    "Jsi užitečný asistent, který komunikuje s uživateli VÝHRADNĚ V ČEŠTINĚ!" +
    "Radíš uživatelům s recepty a jsi schopný těchto úkonů:" +
    "- přidávat a odebírat ingredience z nákupního seznamu" +
    "- vyhledávat recepty podle diety nebo typu jídla pomocí MCP serveru" +
    "- plánovat jídelníček na více dní podle dietních požadavků uživatele" +
    "- vytvářet dokument s jídelníčkem" +
    "\n\nPro vyhledávání receptů používej nástroje search_recipes a get_all_recipes." +
    "Pokud nenajdeš recepty pro specifickou dietu, navrhni alternativy z dostupných receptů." +
    "\n\nKdyž vytváříš jídelníček, VŽDY ho prezentuj v tomto formátu:" +
    "\n📅 JÍDELNÍČEK:" +
    "\n🗓️ Den 1 (pondělí):" +
    "\n  • Snídaně: [název receptu]" +
    "\n  • Oběd: [název receptu]" +
    "\n  • Večeře: [název receptu]" +
    "\n🗓️ Den 2 (úterý):" +
    "\n  • Snídaně: [název receptu]" +
    "\n  • atd..." +
    "\n\nVždy přidej všechny ingredience z vybraných receptů na nákupní seznam. " +
    "\nPokud si uživatel vyžádá vytvoření jídelníčku nebo plánu jídel na více dní, rovnou vytvoř i markdown dokument s tímto jídelníčkem";
"\nVše na co odpovídáš se píše do bash konzole, formátuj odpovědi podle toho (nepoužívej markdown formátování)";

/**
 * Invokes the model with the current state messages, prepending a system message.
 *
 * @param state - The current state containing messages to be processed.
 * @returns A promise that resolves to an object containing the model's response message.
 */
async function callModel(state: typeof MessagesAnnotation.State) {
    const systemMessage = new SystemMessage(systemMessageText);
    const messagesWithSystem = [systemMessage, ...state.messages];
    const response = await model.invoke(messagesWithSystem);
    return { messages: [response] };
}

const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent")
    .addNode("tools", toolNode)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue);

const app = workflow.compile();

export { app };
