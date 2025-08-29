# Rohlík Asistent pro plánování jídelníčku a správu nákupního seznamu (RAPJANS)

This project implements a LangGraph.js Agent that uses a custom built [MCP server](https://github.com/jozso39/rohlik-mcp-server). The agent can:
- manipulate a shoping list via MCP server tool
- search recipes from the MCP server by diet or meal type
- create a meal plan based on user's dietary restrictions
Both of the projects are created as an interview assignmnent to [Rohlík](https://www.rohlik.cz/) company. There is no intention to deploy this code or use it in production.

IMPORTANT: the conversation must be in Czech, since all the recipes are exclusively in Czech language

## Features

The agent can:
- Search for recipes by diet type, meal type, or name
- Get all available recipes
- Add ingredients to a shopping list
- View the current shopping list
- Clear the shopping list
- Use web search (via Tavily) for general questions

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up .env:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

3. **Start the MCP server:**
   Make sure your [Shopping List MCP server](https://github.com/jozso39/rohlik-mcp-server) is running on `http://localhost:8001`

4. **Run the interactive agent:**
   ```bash
   npm run chat
   ```

## Available Scripts

- `npm start` - Run the simple demo
- `npm run chat` - **Interactive chat mode** 💬
- `npm run examples` - Run comprehensive examples
- `npm run agent` - Run the agent directly

## Interactive Mode

Start an interactive chat session with the agent:
```bash
npm run chat
```

Then you can chat naturally:
```
You: Vytvoř mi low-carb jídelníček na týden a přidej ingredience na nákupní seznam
You: přidej mrkev na nákupní seznam
You: najdi mi bezlepkové hlavní chody
You: co mám na nákupním seznamu?
You: smaž vše z nákupního seznamu
```

Special commands:
- `POMOC` - Show available commands
- `RESET` - Clear conversation history
- `DOST` or `STAČILO` - Exit the application

## Documentation

- [MCP Setup Guide](docs/MCP_README.md) - MCP server details
- [MCP Server API Specification](docs/swagger.yaml) - MCP server endpoints