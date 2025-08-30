"""
Main LangGraph agent with MCP tools integration - Python version
"""
import os
from typing import Literal
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, SystemMessage
from langgraph.prebuilt import ToolNode
from langgraph.graph import MessagesState, StateGraph, START, END
from src.tools.mcp_tools import mcp_tools

# Load environment variables from .env file (standard Python way)
load_dotenv()

# Define the tools for the agent to use - only MCP tools for recipe focus
tools = mcp_tools
tool_node = ToolNode(tools)

# Initialize the model
model = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
).bind_tools(tools)

def should_continue(state: MessagesState) -> Literal["tools", "__end__"]:
    """
    Determines the next action based on the last message in the conversation.
    
    If the last message contains tool calls, returns "tools" to indicate that 
    tool processing should continue. Otherwise, returns "__end__" to signal 
    the end of the process.
    """
    messages = state["messages"]
    last_message = messages[-1]
    
    if isinstance(last_message, AIMessage) and last_message.tool_calls:
        return "tools"
    return "__end__"

# System message in Czech
SYSTEM_MESSAGE_TEXT = (
    "Jsi užitečný asistent, který komunikuje s uživateli VÝHRADNĚ V ČEŠTINĚ! "
    "Radíš uživatelům s recepty a jsi schopný těchto úkonů: "
    "- přidávat a odebírat ingredience z nákupního seznamu "
    "- vyhledávat recepty podle diety nebo typu jídla pomocí MCP serveru "
    "- plánovat jídelníček na více dní podle dietních požadavků uživatele "
    "- vytvářet strukturovaný přehled jídelníčku "
    "\n\nPro vyhledávání receptů používej nástroje search_recipes a get_all_recipes. "
    "Pokud nenajdeš recepty pro specifickou dietu, navrhni alternativy z dostupných receptů. "
    "\n\nKdyž vytváříš jídelníček, VŽDY ho prezentuj v tomto formátu: "
    "\n📅 JÍDELNÍČEK: "
    "\n🗓️ Den 1: "
    "\n  • Snídaně: [název receptu] "
    "\n  • Oběd: [název receptu] "
    "\n  • Večeře: [název receptu] "
    "\n🗓️ Den 2: "
    "\n  • Snídaně: [název receptu] "
    "\n  • atd... "
    "\n\nVždy přidej všechny ingredience z vybraných receptů na nákupní seznam. "
    "\nVše na co odpovídáš se píše do bash konzole, formátuj odpovědi podle toho (nepoužívej markdown formátování)"
)

def call_model(state: MessagesState) -> dict:
    """
    Invokes the model with the current state messages, prepending a system message.
    """
    messages = state["messages"]
    system_message = SystemMessage(content=SYSTEM_MESSAGE_TEXT)
    messages_with_system = [system_message] + messages
    
    response = model.invoke(messages_with_system)
    return {"messages": [response]}

# Create the workflow
workflow = StateGraph(MessagesState)

# Add nodes
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

# Add edges
workflow.add_edge(START, "agent")
workflow.add_edge("tools", "agent")
workflow.add_conditional_edges("agent", should_continue)

# Compile the app with recursion limit
app = workflow.compile()

async def create_agent():
    """Create and return the configured agent"""
    return app
