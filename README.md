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

## Project Structure

```
langgraph-js-sample/
├── src/
│   ├── agent.mts              # Main LangGraph agent implementation
│   ├── examples.mts           # Comprehensive examples
│   └── tools/
│       └── mcpTools.mts       # MCP server integration tools
├── docs/
│   ├── MCP_README.md          # Detailed MCP setup guide
│   ├── EXTENDING_MCP_TOOLS.md # Guide for adding new tools
│   ├── swagger.yaml           # MCP server API specification
│   └── llms.txt              # LangGraph.js documentation
├── main.mts                   # Simple entry point
├── .env                       # Environment variables (not in git)
├── .env.example              # Environment template
└── package.json              # Project dependencies and scripts
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

3. **Start the MCP server:**
   Make sure your Shopping List MCP server is running on `http://localhost:8001`

4. **Run the demo:**
   ```bash
   npm start
   ```

## Available Scripts

- `npm start` - Run the simple demo
- `npm run examples` - Run comprehensive examples
- `npm run agent` - Run the agent directly
- `npx tsx src/agent.mts` - Direct agent execution

## Environment Variables

Create a `.env` file with:
```
OPENAI_API_KEY=your_openai_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
MCP_BASE_URL=http://localhost:8001
```

## Documentation

- [MCP Setup Guide](docs/MCP_README.md) - Detailed setup instructions
- [Extending MCP Tools](docs/EXTENDING_MCP_TOOLS.md) - How to add new tools
- [API Specification](docs/swagger.yaml) - MCP server endpoints

## Example Interactions

The agent can handle natural language requests like:
- "Find me vegetarian soup recipes"
- "Add ingredients from that recipe to my shopping list"
- "What's on my shopping list?"
- "Clear my shopping list"
- "Find me some dessert recipes"
