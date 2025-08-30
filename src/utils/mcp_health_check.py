"""
MCP Server Health Check Utility - Python version
"""
import sys
import httpx
from typing import Optional

async def check_mcp_server(url: Optional[str] = None) -> bool:
    """
    Check if the MCP server is available and responding.
    
    Args:
        url: MCP server URL. If None, uses default localhost:8001
        
    Returns:
        bool: True if server is healthy, False otherwise
    """
    if url is None:
        import os
        url = os.getenv("MCP_BASE_URL", "http://localhost:8001")
    
    print(f"🔍 Checking MCP server at {url}...")
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Try to get recipes endpoint as health check
            response = await client.get(f"{url}/get_recipes")
            
            if response.status_code == 200:
                data = response.json()
                recipe_count = len(data.get("recipes", []))
                print(f"✅ MCP server is healthy! Found {recipe_count} recipes.")
                return True
            else:
                print(f"❌ MCP server responded with status {response.status_code}")
                return False
                
    except httpx.TimeoutException:
        print("❌ MCP server health check timed out")
        print("💡 Make sure the MCP server is running on the correct port")
        return False
    except httpx.ConnectError:
        print(f"❌ Cannot connect to MCP server at {url}")
        print("💡 Make sure the MCP server is running and accessible")
        return False
    except Exception as error:
        print(f"❌ MCP server health check failed: {error}")
        return False

def check_mcp_server_sync(url: Optional[str] = None) -> bool:
    """
    Synchronous version of MCP server health check.
    """
    if url is None:
        import os
        url = os.getenv("MCP_BASE_URL", "http://localhost:8001")
    
    print(f"🔍 Checking MCP server at {url}...")
    
    try:
        with httpx.Client(timeout=5.0) as client:
            # Try to get recipes endpoint as health check
            response = client.get(f"{url}/get_recipes")
            
            if response.status_code == 200:
                data = response.json()
                recipe_count = len(data.get("recipes", []))
                print(f"✅ MCP server is healthy! Found {recipe_count} recipes.")
                return True
            else:
                print(f"❌ MCP server responded with status {response.status_code}")
                return False
                
    except httpx.TimeoutException:
        print("❌ MCP server health check timed out")
        print("💡 Make sure the MCP server is running on the correct port")
        return False
    except httpx.ConnectError:
        print(f"❌ Cannot connect to MCP server at {url}")
        print("💡 Make sure the MCP server is running and accessible")
        return False
    except Exception as error:
        print(f"❌ MCP server health check failed: {error}")
        return False
