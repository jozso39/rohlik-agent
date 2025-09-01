"""
Interactive CLI interface for the LangGraph MCP agent - Python version
"""
import os
import sys
import asyncio
import argparse
from typing import List
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from src.agent import app
from src.tools.mcp_tools import clear_shopping_list
from src.utils.mcp_health_check import check_mcp_server_sync
from src.utils.verbose import printVerbose, set_verbose

GOODBYE_MESSAGE = "\n👋 Naschledanou! Váš nákupní seznam byl vyčištěn. Díky že jste využili RohBota!"

# Store conversation history
conversation_history: List = []

def print_welcome():
    """Print welcome message and instructions"""
    print("🤖 Rohlík Asistent pro plánování jídelníčku a správu nákupního seznamu (RohBot)")
    print("====================================================")
    print("💬 Pomůžu ti naplánovat tvůj jídelníček podle exkluzivních rohlíkovských receptů!")
    print("Můžeš mi poroučet například takto:")
    print("   • 'připrav mi týdenní plán vegetariánských jídel'")
    print("   • 'vytvoř mi dokument s jídelníčkem na 2 dny pro vegana'")
    print("   • 'přidej mrkev na nákupní seznam'")
    print("   • 'najdi mi recepty na vegetariánské polévky'")
    print("   • 'co je na mém nákupním seznamu?'")
    print("   • 'odstraň vše z nákupního seznamu'")
    print("   • 'odstraň okurku z nákupního seznamu'")
    print("📝 Napiš 'KONEC' nebo 'STAČILO' k ukončení programu,")
    print("nebo 'POMOC' pro nápovědu, nebo 'RESET' pro restart konverzace.\n")

def print_help():
    """Print help message"""
    print("\n🆘 NÁPOVĚDA:")
    print("="*50)
    print("📋 Dostupné příkazy:")
    print("   • POMOC - zobrazí tuto nápovědu")
    print("   • RESET - vymaže historii konverzace a nákupní seznam")
    print("   • KONEC nebo STAČILO - ukončí program")
    print("\n🍽️ Příklady dotazů:")
    print("   • 'najdi mi vegetariánské recepty'")
    print("   • 'vytvoř jídelníček na 3 dny'")
    print("   • 'přidej brambory na nákupní seznam'")
    print("   • 'co mám na seznamu?'")
    print("   • 'odstraň mléko ze seznamu'")
    print("\n🔧 Spuštění s verbose módem:")
    print("   python main.py --verbose  # zobrazí detaily o spouštění nástrojů")
    print("="*50 + "\n")

async def clean_shopping_list():
    """Clear the shopping list"""
    try:
        result = clear_shopping_list.invoke({})
    except Exception as error:
        print(f"⚠️ Chyba při čištění nákupního seznamu: {error}")

def read_input() -> str:
    """Read user input with prompt"""
    try:
        return input("You: ").strip()
    except EOFError:
        return "KONEC"
    except KeyboardInterrupt:
        return "KONEC"

async def process_user_input(user_input: str) -> bool:
    """
    Process user input and return whether to continue.
    
    Returns:
        bool: True to continue, False to exit
    """
    global conversation_history
    
    # Handle special commands
    if user_input.upper() in ["KONEC", "STAČILO"]:
        print(GOODBYE_MESSAGE)
        await clean_shopping_list()
        return False
    
    if user_input.upper() == "POMOC":
        print_help()
        return True
    
    if user_input.upper() == "RESET":
        conversation_history = []
        await clean_shopping_list()
        print("🔄 Konverzace byla resetována a nákupní seznam vyčištěn.\n")
        return True
    
    if not user_input:
        return True
    
    # Process the message with the agent using streaming
    try:
        # Add user message to history
        user_message = HumanMessage(content=user_input)
        conversation_history.append(user_message)
        
        print("\n🤔 Přemýšlím... ", end="", flush=True)
        
        # Track if we're currently streaming content from the LLM
        is_streaming_content = False
        
        # Stream events from the agent
        async for event in app.astream_events(
            {"messages": conversation_history}, 
            {"recursion_limit": 50},
            version="v1"
        ):
            kind = event["event"]
            
            # Handle LLM token streaming
            if kind == "on_chat_model_stream":
                data = event.get("data", {})
                chunk = data.get("chunk")
                if chunk and hasattr(chunk, 'content') and chunk.content:
                    print(chunk.content, end="", flush=True)
                    is_streaming_content = True
            
            # Handle tool execution start
            elif kind == "on_tool_start":
                if is_streaming_content:
                    print()  # New line after content streaming
                    is_streaming_content = False
                tool_name = event["name"]
                printVerbose(f"\n🔧 Executing tool: {tool_name}")
            
            # Handle tool execution end
            elif kind == "on_tool_end":
                tool_name = event["name"]
                printVerbose(f"✅ Tool completed: {tool_name}")
        
        # Get the final state using ainvoke (not aget_state which requires checkpointer)
        final_result = await app.ainvoke(
            {"messages": conversation_history}, 
            {"recursion_limit": 50}
        )
        
        # Update conversation history with the final response
        if final_result and "messages" in final_result:
            conversation_history = final_result["messages"]
        
        if is_streaming_content:
            print()  # New line after streaming
        print()  # Extra line for spacing
            
    except Exception as error:
        print(f"\n❌ Chyba při zpracování dotazu: {error}\n")
        
    return True

async def start_interactive_session():
    """Start the interactive session"""
    # Load environment variables from .env file
    load_dotenv()
    
    # Get MCP server URL
    mcp_base_url = os.getenv("MCP_BASE_URL", "http://localhost:8001")
    
    # Check MCP server health
    if not check_mcp_server_sync(mcp_base_url):
        print("❌ MCP server is not available. Please start the server and try again.")
        sys.exit(1)
    
    # Print welcome message
    print_welcome()
    
    # Main interaction loop
    while True:
        try:
            user_input = read_input()
            should_continue = await process_user_input(user_input)
            
            if not should_continue:
                break
                
        except Exception as error:
            print(f"❌ Neočekávaná chyba: {error}")
            print("Zkuste to znovu nebo napište 'KONEC' pro ukončení.\n")

def main():
    """Main entry point"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="RohBot - Rohlík asistent pro plánování jídelníčku a správu nákupního seznamu")
    parser.add_argument("-v", "--verbose", action="store_true", 
                        help="Enable verbose output (shows tool execution details)")
    args = parser.parse_args()
    
    # Set verbose mode based on command line argument
    set_verbose(args.verbose)
    
    try:
        asyncio.run(start_interactive_session())
    except KeyboardInterrupt:
        print(GOODBYE_MESSAGE)
        # Run cleanup in sync mode since we're exiting
        try:
            clear_shopping_list.invoke({})
        except:
            pass
        sys.exit(0)
    except Exception as error:
        print(f"❌ Fatal error: {error}")
        sys.exit(1)

if __name__ == "__main__":
    main()
