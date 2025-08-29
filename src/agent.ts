// agent.mts - Main LangGraph agent with MCP tools integration

// Load environment variables from .env file
import "dotenv/config";

import { TavilySearch } from "@langchain/tavily";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { writeFileSync } from "node:fs";
import { mcpTools } from "./tools/mcpTools";

// Define the tools for the agent to use
const tools = [new TavilySearch({ maxResults: 3 }), ...mcpTools];
const toolNode = new ToolNode(tools);

// Create a model and give it access to the tools
const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
}).bindTools(tools);

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
    const lastMessage = messages[messages.length - 1] as AIMessage;

    // If the LLM makes a tool call, then we route to the "tools" node
    if (lastMessage.tool_calls?.length) {
        return "tools";
    }
    // Otherwise, we stop (reply to the user) using the special "__end__" node
    return "__end__";
}

const systemMessage =
    "Jsi užitečný asistent, který komunikuje s uživateli VÝHRADNĚ V ČEŠTINĚ!" +
    "Radíš uživatelům s recepty a jsi schopný těchto úkonů:" +
    "- přidávat a odebírat ingredience z nákupního seznamu" +
    "- vyhledávat recepty podle diety nebo typu jídla" +
    "- plánovat jídelníček na více dní podle dietních požadavků uživatele";

// Define the function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
    const systemMessage = new SystemMessage(systemMessage);
    const messagesWithSystem = [systemMessage, ...state.messages];
    const response = await model.invoke(messagesWithSystem);
    return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
    .addNode("tools", toolNode)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue);

// Finally, we compile it into a LangChain Runnable.
const app = workflow.compile();

// Export the compiled app for use in other files
export { app };

// async function runAgent() {
//     const finalState = await app.invoke({
//         messages: [
//             new HumanMessage(
//                 "I want to cook something vegetarian tonight. Can you help me find a vegetarian recipe and add the ingredients to my shopping list?",
//             ),
//         ],
//     });
//     console.log(
//         finalState.messages[finalState.messages.length - 1].content,
//     );

//     const nextState = await app.invoke({
//         // Including the messages from the previous run gives the LLM context.
//         messages: [
//             ...finalState.messages,
//             new HumanMessage("Can you show me my current shopping list?"),
//         ],
//     });
//     console.log(nextState.messages[nextState.messages.length - 1].content);
// }

// if (require.main === module) {
//     runAgent().catch(console.error);
// }
