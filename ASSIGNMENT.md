*1. Background & Vision

At Rohlik Group, our goal is to make AI the default way we serve and grow our customer base. We are moving beyond simple models to build intelligent, autonomous systems that redefine our business.
# 1. Background & Vision

At Rohlik Group, our goal is to make AI the default way we serve and grow our customer base. We are moving beyond simple models to build intelligent, autonomous systems that redefine our business.

This case study is based on the **"Chef in My Pocket"** product concept from our AI-First Product Leader challenge. The vision is to create a meal-planning agent that turns a generic grocery run into a personalized, outcome-driven experience for the user.

As a candidate for the AI Engineer role, you are a "player-coach" who is expected to lead technical strategy while maintaining a significant hands-on contribution (70%). This challenge is designed to assess your ability to quickly architect and build a sophisticated, agentic MVP that forms the technical foundation for this product vision.

---

# 2. The Task: Build a "Chef in My Pocket" Agent

Your task is to design and build a functional proof-of-concept AI agent that helps a user plan their meals for a few days based on a dietary goal. The agent must demonstrate planning, tool use, and memory.

**Core Agent Behavior:**

- The agent should start by asking the user for a dietary goal (e.g., "low-carb," "vegetarian," "high-protein") and the number of days for the meal plan.
- Based on the input, the agent must plan its steps, then use tools to execute that plan.
- The agent must interact with a set of tools you create (exposed via an MCP server) to find suitable recipes and add their ingredients to a shopping list.
- The agent must present the final meal plan and the complete shopping list to the user.
- The agent must maintain conversational memory to handle at least one follow-up request, such as "Actually, can you replace the Day 2 recipe with something else?"

# 3. Key Technical Requirements

This is not just about writing a script. We want to see how you build a robust, extensible system. You might need to simplify some parts and we want to see where you have chosen to do so.

- **Working AI Agent:** You must use a modern agentic framework (e.g., LangGraph or build your own) to implement the core logic. The agent's ability to reason, plan, and delegate tasks to tools is critical.
- **MCP Server for Tooling:** You must create and run a simple MCP server that exposes at least two custom tools to your agent. This demonstrates your ability to build structured, interoperable AI systems. Example:
	- **Tool 1:** `recipe_finder` — A tool that can search the provided recipe dataset based on criteria (e.g., keywords, dietary tags).
	- **Tool 2:** `shopping_list_manager` — A tool that can create a shopping list, add ingredients to it, and retrieve the final list.
- **Conversational Memory:** The agent must be able to recall previous turns in the conversation to handle follow-up requests contextually.

**Dataset:**

Please use this pre-existing dataset of recipes:  
[Recipe Dataset](https://drive.google.com/file/d/1Ny9T_DUK0fLaisvATVAlwSdS4QoNtagb/view?usp=sharing)

# 4. Deliverables

- **Source Code:** All Python code for the agent, the MCP server, and any data processing scripts, submitted as a Git repository link or a zip file.
- **System Design:** A brief document covering:
	- A high-level architecture diagram of your solution.
	- A short explanation of your key technical choices (Why this agent framework? Why this model?).

# 5. Evaluation Criteria

We are assessing your skills as a senior technical leader. The evaluation will be weighted as follows:

- **Effectiveness of the Agentic System (60%):** Does the agent successfully plan and use tools to fulfill the user's request? Is the logic sound and robust?
- **Technical Architecture & Tooling (30%):** What frameworks and design choices you made and is the logic of that sound?
- **Clarity & Code Quality (10%):** Is the code well-structured and easy to understand? Is the design write-up clear and concise?