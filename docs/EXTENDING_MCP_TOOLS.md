# Extending MCP Tools in LangGraph.js

This guide explains how to add new tools to interact with your MCP server.

## Adding a New MCP Tool

To add a new tool, follow this pattern in `mcpTools.mts`:

```typescript
export const newMcpTool = new DynamicStructuredTool({
    name: "tool_name",
    description: "Clear description of what the tool does and when to use it",
    schema: z.object({
        parameter1: z.string().describe("Description of parameter1"),
        parameter2: z.number().optional().describe("Optional parameter description")
    }),
    func: async ({ parameter1, parameter2 }) => {
        try {
            // Make HTTP request to your MCP server
            const response = await fetch(`${MCP_BASE_URL}/endpoint`, {
                method: 'POST', // or GET
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ parameter1, parameter2 }) // for POST requests
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
});
```

## Best Practices

### Tool Naming
- Use descriptive names that clearly indicate the tool's purpose
- Use snake_case for consistency
- Avoid generic names like "query" or "get_data"

### Tool Descriptions
- Write clear, concise descriptions
- Explain when the tool should be used
- Include context about what the tool returns

### Schema Design
- Use Zod for robust input validation
- Provide detailed descriptions for each parameter
- Mark optional parameters as `.optional()`
- Use appropriate types (string, number, boolean, array)

### Error Handling
- Always wrap API calls in try-catch blocks
- Return meaningful error messages
- Check HTTP response status
- Handle network failures gracefully

### Response Formatting
- Return JSON.stringify for complex objects
- Use consistent formatting (null, 2 for pretty printing)
- Include relevant context in responses

## Example: Adding a Recipe Rating Tool

```typescript
export const rateRecipeTool = new DynamicStructuredTool({
    name: "rate_recipe",
    description: "Rate a recipe from 1-5 stars and optionally add a comment",
    schema: z.object({
        recipe_id: z.string().describe("The ID of the recipe to rate"),
        rating: z.number().min(1).max(5).describe("Rating from 1-5 stars"),
        comment: z.string().optional().describe("Optional comment about the recipe")
    }),
    func: async ({ recipe_id, rating, comment }) => {
        try {
            const response = await fetch(`${MCP_BASE_URL}/rate_recipe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recipe_id, rating, comment })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return `Recipe rated successfully: ${JSON.stringify(data, null, 2)}`;
        } catch (error) {
            return `Error rating recipe: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
});
```

Then add it to the exports:

```typescript
export const mcpTools = [
    searchRecipesTool,
    getAllRecipesTool,
    addIngredientsToShoppingListTool,
    getShoppingListTool,
    clearShoppingListTool,
    rateRecipeTool // Add new tool here
];
```

## Testing New Tools

1. Add the tool to `mcpTools.mts`
2. Ensure your MCP server supports the endpoint
3. Test with a simple conversation in your agent
4. Add error cases to verify error handling

## Common Patterns

### GET Requests (No Parameters)
```typescript
const response = await fetch(`${MCP_BASE_URL}/endpoint`);
```

### GET Requests (With Query Parameters)
```typescript
const params = new URLSearchParams();
if (param1) params.append('param1', param1);
const response = await fetch(`${MCP_BASE_URL}/endpoint?${params.toString()}`);
```

### POST Requests (With Body)
```typescript
const response = await fetch(`${MCP_BASE_URL}/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});
```

This pattern ensures consistency and maintainability across all your MCP tools.
