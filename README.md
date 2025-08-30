# 🤖 Rohlík asistent pro plánování jídelníčku a správu nákupního seznamu (RohBot)

This project implements a [LangGraph Python Agent](https://python.langchain.com/docs/langgraph/) that uses a custom built [MCP server](https://github.com/jozso39/rohlik-mcp-server). The LLM that powers the agent is OpenAI's `gpt-4o-mini`.
Both of the projects are created as an interview assignment to [Rohlík](https://www.rohlik.cz/) company. There is no intention to deploy this code.

The agent can:
- Create meal plans based on user's dietary restrictions (vegetarian, low-carb, etc.)
- Search recipes from the MCP server by diet or meal type
- Manipulate a shopping list via MCP server tools
- Handle follow-up requests and maintain conversational memory

**⚠️ IMPORTANT:** The conversation must be in Czech, since all the recipes are exclusively in Czech language

## ✨ Features

The agent can:
- Search for recipes by diet type, meal type, or name
- Get all available recipes from the database
- Add ingredients to a shopping list
- View the current shopping list
- Clear the shopping list
- Remove specific ingredients from shopping list
- Create structured meal plans with emoji formatting

## 📋 Requirements

1. **Python 3.9+** with virtual environment
2. **MCP server** running on `http://localhost:8001`
3. **OpenAI API key** in `.env` file

## 🚀 Quick Start

1. **Clone and setup:**
   ```bash
   git clone <repository>
   cd langgraph-js-sample
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```

3. **Start the MCP server** (see MCP Setup Guide below)

4. **Run the agent:**
   ```bash
   # Demo version
   python main.py
   
   # Interactive chat
   python -m src.interactive
   ```

## 📖 How-to

### 🏃‍♂️ Starting the MCP server
Check [Shopping List MCP server](https://github.com/jozso39/rohlik-mcp-server) for instructions, the server must be running on `http://localhost:8001`

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
```bash
# Install Python 3.9+ if not already installed
python3 --version

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## 💬 Interactive Agent

Start an interactive chat session with the agent:

```bash
python -m src.interactive
```

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

## 🧪 Testing

Run the test suite:

```bash
# Activate virtual environment
source venv/bin/activate

# Run tests
python -m pytest tests/ -v
```

## 📁 Project Structure

```
├── main.py                 # Demo script
├── src/
│   ├── agent.py           # LangGraph agent implementation
│   ├── interactive.py     # Interactive CLI interface
│   ├── tools/
│   │   └── mcp_tools.py   # MCP server integration tools
│   └── utils/
│       └── mcp_health_check.py  # Health check utilities
├── tests/                 # Test suite
├── docs/                  # Documentation
├── pyproject.toml         # Python project configuration
└── requirements.txt       # Python dependencies
```

## 📚 Documentation

- [MCP Setup Guide](docs/MCP_README.md) - MCP server details
- [MCP Server API Specification](docs/swagger.yaml) - MCP server endpoints  
- [Python Migration Guide](PYTHON_MIGRATION.md) - Details about the Python conversion

## 🔄 Migration Notes

This project was originally built with Deno and LangGraph.js but has been migrated to Python and LangGraph Python for better AI/ML ecosystem integration. All original functionality has been preserved with the following improvements:

- **Modern Python packaging** with pyproject.toml
- **Async/await patterns** throughout the codebase  
- **httpx client** for robust HTTP handling
- **pytest testing framework** with async support
- **Type hints** and Pydantic schemas for better development experience

The agent maintains full feature parity with the original TypeScript implementation while leveraging Python's rich AI/ML ecosystem.
