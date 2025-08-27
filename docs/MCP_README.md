# LangGraph.js MCP Server Integration Sample

This project demonstrates how to integrate a Model Context Protocol (MCP) server with LangGraph.js to create an intelligent agent that can manage recipes and shopping lists.

## Features

The agent can:
- Search for recipes by diet type, meal type, or name
- Get all available recipes
- Add ingredients to a shopping list
- View the current shopping list
- Clear the shopping list
- Use web search (via Tavily) for general questions

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up your environment variables:**
   Copy the `.env.example` file to `.env` and add your actual API keys:
   ```bash
   cp .env.example .env
   ```
   
   Then edit the `.env` file with your actual API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   MCP_BASE_URL=http://localhost:8001
   ```

3. **Start the MCP server:**
   Make sure your Shopping List MCP server is running on `http://localhost:8001`

4. **Run the agent:**
   ```bash
   npx tsx agent.mts
   ```

   Or run the comprehensive examples:
   ```bash
   npx tsx example.mts
   ```

## File Structure

- `agent.mts` - Main agent implementation with MCP tools
- `mcpTools.mts` - Custom tools for interacting with the MCP server
- `example.mts` - Comprehensive examples showing all MCP functionality
- `package.json` - Project dependencies

## MCP Tools Available

### Recipe Management
- **search_recipes**: Search recipes by diet, meal type, or name
- **get_all_recipes**: Get all available recipes

### Shopping List Management
- **add_ingredients_to_shopping_list**: Add ingredients to shopping list
- **get_shopping_list**: View current shopping list
- **clear_shopping_list**: Clear all items from shopping list

## Example Interactions

The agent can handle natural language requests like:
- "Find me vegetarian soup recipes"
- "Add ingredients from that recipe to my shopping list"
- "What's on my shopping list?"
- "Clear my shopping list"
- "Find me some dessert recipes"

## MCP Server Requirements

This project assumes you have a Shopping List MCP server running that provides the following endpoints:
- `GET /get_recipes`
- `GET /search_recipes`
- `POST /add_ingredients`
- `GET /get_shopping_list`
- `POST /clear_shopping_list`

See the included `swagger.yaml` for the complete API specification.
