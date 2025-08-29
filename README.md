# Rohlík asistent pro plánování jídelníčku a správu nákupního seznamu (RohBot)

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
- Remove specific ingredients from shopping list
- Create structured meal plans with complete recipes

## Quick Start

1. **Install Deno (if not already installed):**
   ```bash
   curl -fsSL https://deno.land/install.sh | sh
   # or via package manager: brew install deno
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
   deno task chat
   ```

## Available Scripts

- `deno task dev` - Run the simple demo
- `deno task chat` - **Interactive chat mode** 💬
- `deno task check` - Type check all TypeScript files
- `deno task fmt` - Format all TypeScript files
- `deno task fmt:check` - Check if files are formatted
- `deno task lint` - Lint all TypeScript files

## Interactive Mode

Start an interactive chat session with the agent:

```bash
deno task chat
```

Then you can chat naturally:

```
You: Vytvoř mi low-carb jídelníček na týden a přidej ingredience na nákupní seznam
You: přidej mrkev na nákupní seznam
You: najdi mi bezlepkové hlavní chody
You: co mám na nákupním seznamu?
You: smaž vše z nákupního seznamu
You: odstraň okurku z nákupního seznamu
```

Special commands:

- `POMOC` - Show available commands
- `RESET` - Clear conversation history and shopping list
- `KONEC` or `STAČILO` - Exit the application

## Technology Stack

- **Runtime**: Deno 🦕
- **Language**: TypeScript
- **Framework**: LangGraph.js
- **LLM**: OpenAI GPT-4o-mini
- **MCP**: Model Context Protocol for tool integration
- **Environment**: `.env` file loaded via `--env-file` flag

## Documentation

- [MCP Setup Guide](docs/MCP_README.md) - MCP server details
- [MCP Server API Specification](docs/swagger.yaml) - MCP server endpoints
