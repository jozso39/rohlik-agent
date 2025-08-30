"""
Main demo script for RohBot - Python version
"""
import asyncio
import os
from langchain_core.messages import HumanMessage
from src.agent import app
from src.utils.mcp_health_check import check_mcp_server_sync
from src.utils.load_env import load_env

async def main():
    """Main demo function"""
    # Load environment variables
    load_env()
    
    print("🤖 RohBot Demo")
    print("=====================================\n")
    
    # Get MCP server URL
    mcp_base_url = os.getenv("MCP_BASE_URL", "http://localhost:8001")
    
    # Check MCP server health
    if not check_mcp_server_sync(mcp_base_url):
        print("❌ MCP server is not available. Please start the server and try again.")
        return
    
    # Demo message
    human_message_text = (
        "Chci abys mi vytvořil jídelníček na 3 dny dopředu. "
        "vytvoř mi i dokument s tímto plánem. Jsem vegetarian"
    )
    
    print("Tohle je malé demo RohBota (Rohlík asistent pro plánování jídelníčku a správu nákupního seznamu)\n")
    print(f"User: {human_message_text}")
    
    try:
        # Invoke the agent
        result = await app.ainvoke({
            "messages": [HumanMessage(content=human_message_text)]
        })
        
        # Get the last message (agent's response)
        if result["messages"]:
            agent_response = result["messages"][-1]
            print("🍽️ Agent Response:")
            print(agent_response.content)
        else:
            print("⚠️ No response received from agent")
            
    except Exception as error:
        print(f"❌ Error during demo: {error}")
    
    print("\n🎯 Chceš použít tohoto agenta interaktivně? Spusť: python -m src.interactive")

if __name__ == "__main__":
    asyncio.run(main())
