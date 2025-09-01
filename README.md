# 🤖 Rohlík asistent pro plánování jídelníčku a správu nákupního seznamu (RohBot)

This project implements a
[LangGraph Python Agent](https://python.langchain.com/docs/langgraph/) that uses
a custom built [MCP server](https://github.com/jozso39/rohlik-mcp-server). The
LLM that powers the agent is OpenAI's `gpt-4o-mini`. Both of the projects are
created as an interview assignment to [Rohlík](https://www.rohlik.cz/) company.
There is no intention to deploy this code.

The agent can:

- Create meal plans based on user's dietary restrictions (vegetarian, low-carb,
  etc.)
- Search recipes from the MCP server by diet or meal type
- Manipulate a shopping list via MCP server tools
- Handle follow-up requests and maintain conversational memory

**⚠️ IMPORTANT:** The conversation must be in Czech, since all the recipes are
exclusively in Czech language

## ✨ Features

The agent can:

- Search for recipes by diet type, meal type, or name
- Get all available recipes from the database
- Add ingredients to a shopping list
- View the current shopping list
- Clear the shopping list
- Remove specific ingredients from shopping list
- Create structured meal plans with emoji formatting
- **Real-time streaming responses** - See the agent's thoughts and tool
  executions as they happen, just like ChatGPT!

## 📋 Requirements

1. **Python 3.9+** with virtual environment
2. **MCP server** running on `http://localhost:8001`
3. **OpenAI API key** in `.env` file

## 🚀 Quick Start

1. **Configure environment:** The setup script will create `.env` file from
   `.env.example`. Edit it with your OpenAI API key:
   ```bash
   # Edit .env with your OpenAI API key
   ```

2. **Start the MCP server** (see MCP Setup Guide below)

3. **Run the agent:**
   ```bash
   # Interactive chat (main interface)
   python main.py

   # Interactive chat with verbose output (shows tool execution details)
   python main.py --verbose

   # Demo version (always runs with clean output)
   python demo.py
   ```

## 📖 How-to

### 🏃‍♂️ Starting the MCP server

Check [Shopping List MCP server](https://github.com/jozso39/rohlik-mcp-server)
for instructions, the server must be running on `http://localhost:8001`

### 🔐 Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

The `.env` file should contain:

```bash
OPENAI_API_KEY=your_openai_api_key_here
MCP_BASE_URL=http://localhost:8001
```

### 🐍 Python Setup

Use the automated setup script:

```bash
./setup.sh
```

Or manually:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 💬 Interactive Agent

Start an interactive chat session with the agent:

```bash
python main.py
```

The agent features **real-time streaming** - you'll see responses appear
character by character as the LLM generates them, and you'll get live updates
when tools are being executed. This provides a ChatGPT-like experience where you
can see the agent "thinking" in real-time.

Then you can chat naturally in Czech:

```
- Vytvoř mi low-carb jídelníček na týden a přidej ingredience na nákupní seznam
- přidej mrkev na nákupní seznam
- najdi mi bezlepkové hlavní chody
- co mám na nákupním seznamu?
- smaž vše z nákupního seznamu
- odstraň okurku z nákupního seznamu
- vyměň recept na den 2 za něco jiného
```

Special commands:

- `POMOC` - Show available commands
- `RESET` - Clear conversation history and shopping list
- `KONEC` or `STAČILO` - Exit the application

## 🔍 Verbose Mode

The `main.py` script supports a verbose flag that shows additional debugging
information:

```bash
# Run with verbose output to see tool execution details
python main.py --verbose
```

**Note:** The `demo.py` script always runs with clean output (no verbose mode)
to showcase the best user experience.

## 🧪 Testing

Run the test suite:

```bash
python -m pytest tests/ -v
```

## 📚 Documentation

- [MCP Setup Guide](docs/MCP_README.md) - MCP server details
- [MCP Server API Specification](docs/swagger.yaml) - MCP server endpoints
