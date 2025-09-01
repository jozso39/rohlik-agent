"""
Main demo script for RohBot - Python version
"""
import asyncio
import os
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from src.agent import app
from src.utils.mcp_health_check import check_mcp_server_sync

async def main():
    """Main demo function"""
    # Load environment variables from .env file
    load_dotenv()
    
    print("🤖 RohBot Demo")
    print("=====================================\n")
    
    # Get MCP server URL
    mcp_base_url = os.getenv("MCP_BASE_URL", "http://localhost:8001")
    
    # Check MCP server health
    if not check_mcp_server_sync(mcp_base_url):
        print("❌ MCP server is not available. Please start the server and try again.")
        return
    
    # Demo message
    human_message_text = "Chci abys mi vytvořil jídelníček na 3 dny dopředu. Jsem vegetarian"
    
    print("Tohle je malé demo RohBota (Rohlík asistent pro plánování jídelníčku a správu nákupního seznamu)\n")
    print(f"User: {human_message_text}")
    
    try:
        print("\n🤔 Přemýšlím... ", end="", flush=True)
        
        # Track if we're currently streaming content from the LLM
        is_streaming_content = False
        
        # Stream events from the agent to demonstrate real-time responses
        async for event in app.astream_events(
            {"messages": [HumanMessage(content=human_message_text)]},
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
                print(f"\n🔧 Executing tool: {tool_name}")
            
            # Handle tool execution end
            elif kind == "on_tool_end":
                tool_name = event["name"]
                print(f"✅ Tool completed: {tool_name}")
        
        if is_streaming_content:
            print()  # New line after streaming
            
    except Exception as error:
        print(f"\n❌ Error during demo: {error}")
    
    print("🎯 Chceš použít tohoto agenta interaktivně? Spusť: python main.py")

if __name__ == "__main__":
    asyncio.run(main())
