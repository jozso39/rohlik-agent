# 🤖 Rohlík asistent pro plánování jídelníčku a správu nákupního seznamu (RohBot)

This project is built with [Deno](https://deno.com/) and implements a [LangGraph.js Agent](https://langchain-ai.github.io/langgraphjs/) that uses a custom built [MCP server](https://github.com/jozso39/rohlik-mcp-server). The LLM that powers the agent is OpenAI's `gpt-4o-mini`.
Both of the projects are created as an interview assignmnent to [Rohlík](https://www.rohlik.cz/) company. There is no intention to deploy this code.
The agent can:

- create a meal plan based on user's dietary restrictions
- create a markdown file with the meal plan and the recipes
- manipulate a shoping list via MCP server tool
- search recipes from the MCP server by diet or meal type

**⚠️ IMPORTANT:** the conversation must be in Czech, since all the recipes are exclusively in Czech language

## ✨ Features

The agent can:

- Search for recipes by diet type, meal type, or name
- Get all available recipes
- Add ingredients to a shopping list
- View the current shopping list
- Clear the shopping list
- Remove specific ingredients from shopping list
- Create structured meal plans with complete recipes
- **Real-time streaming responses** - See responses appear character by character like ChatGPT
- **Live tool execution tracking** - Watch which tools are being used in real-time


## 📋 Common requirements
1. The MCP server must be running
2. .env file must be created and must contain OpenAI API key
(for more details, see the How-to section)

## 🚀 Quick Start when you have the executables

The executables are zipped in `/bin` folder, pick the one for your OS and follow these instructions:

1. Create a valid `.env` file and put it in the save folder with the executables
2. Make sure the MCP server is running on `http://localhost:8001`
3. Unzip the requested executable with `deno task unzip:macos` or `deno task unzip:windows`
4. Run the executable with `bin/rohbot-macos` or Windows equivalent of this command

## 💻 Quick Start for development
1. Install deno
1. Create a valid `.env` file and put it in the save folder with the executables
1. Make sure the MCP server is running on `http://localhost:8001`
1. install dependencies with `deno install`
1. run the interactive agent with `deno task chat` or the demo with `deno task demo`

## 📖 How-to

### 🏃‍♂️ Starting the MCP server
Check [Shopping List MCP server](https://github.com/jozso39/rohlik-mcp-server) for instructions, the server must be running on `http://localhost:8001`

### 🔐 Environment Variables
Create a `.env` file in the same directory as the executable:
```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

**Installing Deno**
```bash
curl -fsSL https://deno.land/install.sh | sh
# or via package manager: brew install deno
```

---

## 💬 Interactive Agent

Start an interactive chat session with the agent:

```bash
deno task chat
```

**🎬 Streaming Experience:**
- Responses appear character by character in real-time like ChatGPT
- Live tool execution indicators: `🔧 Používám nástroj: [tool_name]`
- Tool completion notifications: `✅ Nástroj [tool_name] dokončen`

Then you can chat naturally:

```
- Vytvoř mi low-carb jídelníček na týden a přidej ingredience na nákupní seznam
- vytvoř mi dokument s tímto jídelníčkem
- přidej mrkev na nákupní seznam
- najdi mi bezlepkové hlavní chody
- co mám na nákupním seznamu?
- smaž vše z nákupního seznamu
- odstraň okurku z nákupního seznamu
```

Special commands:

- `POMOC` - Show available commands
- `RESET` - Clear conversation history and shopping list
- `KONEC` or `STAČILO` - Exit the application

## 🔧 Building Executables

To build new executables from source:

```bash
# Build all platforms
deno task build:all

# Build specific platform
deno task build:macos
deno task build:windows
```

Executables are created in the `./bin/` directory.

## 📚 Documentation

- [MCP Setup Guide](docs/MCP_README.md) - MCP server details
- [MCP Server API Specification](docs/swagger.yaml) - MCP server endpoints

## 🚀 Technical Features

**Real-time Streaming:**
- Uses LangGraph.js `streamEvents` API for token-level streaming
- ChatOpenAI model configured with `streaming: true`
- Progressive response generation for enhanced user experience
- Live tool execution tracking with visual indicators

## TODO
- disable the get-all-recipes endpoint, becuase what if there is milions of the recipes
- extend the search endpoint so that it can include or exclude ingredients
- create endpoint to list possible diets
- create endpoint to list possible ingredients
- fix the problem with weird diets (non-existent in current dataset):
  - add tool that will tavily-search for the diet that is not in our list of diets, what ingredients are included and excluded