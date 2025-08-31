"""
Interactive CLI interface for the LangGraph MCP agent - Python version
"""
import os
import sys
import asyncio
from typing import List
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from src.agent import app
from src.tools.mcp_tools import clear_shopping_list
from src.utils.mcp_health_check import check_mcp_server_sync

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
    print("="*50 + "\n")

async def clean_shopping_list():
    """Clear the shopping list"""
    try:
        result = clear_shopping_list.invoke({})
        print("🧹 Nákupní seznam byl vyčištěn.")
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
    
    # Process the message with the agent
    try:
        # Add user message to history
        user_message = HumanMessage(content=user_input)
        conversation_history.append(user_message)
        
        # Get agent response with recursion limit
        response = await app.ainvoke(
            {"messages": conversation_history}, 
            {"recursion_limit": 50}
        )
        
        # Get the last message (agent's response)
        if response["messages"]:
            agent_response = response["messages"][-1]
            print(f"\n🤖 RohBot: {agent_response.content}\n")
            
            # Add agent response to history
            conversation_history.append(agent_response)
        else:
            print("⚠️ Nepodařilo se získat odpověď od agenta.\n")
            
    except Exception as error:
        print(f"❌ Chyba při zpracování dotazu: {error}\n")
        
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
