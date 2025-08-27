// mcpTools.mts - Custom tools for the Shopping List MCP Server

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Base URL for the MCP server
const MCP_BASE_URL = process.env.MCP_BASE_URL || "http://localhost:8001";

// Tool for searching recipes
export const searchRecipesTool = new DynamicStructuredTool({
    name: "search_recipes",
    description:
        "Search for recipes by diet type, meal type, or name. Useful for finding recipes that match specific criteria.",
    schema: z.object({
        diet: z.string().optional().describe(
            "Filter recipes by diet category (e.g., vegetarian, vegan, high-protein, masité)",
        ),
        meal_type: z.string().optional().describe(
            "Filter recipes by meal type (e.g., polévka, hlavní chod, desert)",
        ),
        name: z.string().optional().describe(
            "Search recipes by name (partial match)",
        ),
    }),
    func: async ({ diet, meal_type, name }) => {
        try {
            const params = new URLSearchParams();
            if (diet) params.append("diet", diet);
            if (meal_type) params.append("meal_type", meal_type);
            if (name) params.append("name", name);
            const paramsString = JSON.stringify(
                Object.fromEntries(params.entries()),
            );
            console.log(
                `LOG: searching for recipe with these parameters 🔎: ${paramsString}`,
            );

            const response = await fetch(
                `${MCP_BASE_URL}/search_recipes?${params.toString()}`,
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return `Error searching recipes: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Tool for getting all recipes
export const getAllRecipesTool = new DynamicStructuredTool({
    name: "get_all_recipes",
    description:
        "Get a list of all available recipes in the database. The list of recipes is way too long, so use this tool only when necessary",
    schema: z.object({}),
    func: async () => {
        try {
            console.log("LOG: getting a list of all recipes 📖");
            const response = await fetch(`${MCP_BASE_URL}/get_recipes`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return `Error getting recipes: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Tool for adding ingredients to shopping list
export const addIngredientsToShoppingListTool = new DynamicStructuredTool({
    name: "add_ingredients_to_shopping_list",
    description:
        "Add multiple ingredients to the shopping list. Useful when planning meals or when users want to add specific items.",
    schema: z.object({
        ingredients: z.array(z.string()).describe(
            "Array of ingredient names to add to the shopping list",
        ),
    }),
    func: async ({ ingredients }) => {
        try {
            console.log(
                "LOG: adding ingredients to cart 🫳: " + ingredients.join(", "),
            );

            const response = await fetch(`${MCP_BASE_URL}/add_ingredients`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ingredients }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return `Error adding ingredients: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Tool for getting the current shopping list
export const getShoppingListTool = new DynamicStructuredTool({
    name: "get_shopping_list",
    description:
        "Get the current shopping list with all items that need to be purchased.",
    schema: z.object({}),
    func: async () => {
        try {
            const response = await fetch(`${MCP_BASE_URL}/get_shopping_list`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const list = JSON.stringify(data, null, 2);
            console.log("LOG: got the cart 🛒: " + list);
            return list;
        } catch (error) {
            return `Error getting shopping list: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Tool for clearing the shopping list
export const clearShoppingListTool = new DynamicStructuredTool({
    name: "clear_shopping_list",
    description:
        "Clear all items from the shopping list. Use this when the user wants to start fresh or has completed their shopping.",
    schema: z.object({}),
    func: async () => {
        try {
            console.log("LOG: clearing the cart! 🚮");
            const response = await fetch(
                `${MCP_BASE_URL}/clear_shopping_list`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return `Error clearing shopping list: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Export all MCP tools as an array
export const mcpTools = [
    searchRecipesTool,
    getAllRecipesTool,
    addIngredientsToShoppingListTool,
    getShoppingListTool,
    clearShoppingListTool,
];
