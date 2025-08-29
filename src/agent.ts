// agent.mts - Main LangGraph agent with MCP tools integration

// Load environment variables from .env file
import "dotenv/config";

import { TavilySearch } from "@langchain/tavily";
import { ChatOpenAI } from "@langchain/openai";
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { writeFileSync } from "node:fs";
import { mcpTools } from "./tools/mcpTools";

// Define the tools for the agent to use
const tools = [new TavilySearch({ maxResults: 3 }), ...mcpTools];
const toolNode = new ToolNode(tools);

const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
}).bindTools(tools);

// function that determines whether to continue or not
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
    "- vyhledávat recepty podle diety nebo typu jídla" +
    "- plánovat jídelníček na více dní podle dietních požadavků uživatele" +
    "\n\nKdyž vytváříš jídelníček, VŽDY ho prezentuj v tomto formátu:" +
    "\n📅 JÍDELNÍČEK:" +
    "\n🗓️ Den 1 (pondělí):" +
    "\n  • Snídaně: [název receptu]" +
    "\n  • Oběd: [název receptu]" +
    "\n  • Večeře: [název receptu]" +
    "\n🗓️ Den 2 (úterý):" +
    "\n  • Snídaně: [název receptu]" +
    "\n  • atd..." +
    "\n\nVždy přidej všechny ingredience z vybraných receptů na nákupní seznam.";

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
