// mcpTools.mts - Custom tools for the Shopping List MCP Server

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Base URL for the MCP server
const MCP_BASE_URL = process.env.MCP_BASE_URL || "http://localhost:8001";

// Tool for searching recipes
export const searchRecipesTool = new DynamicStructuredTool({
    name: "search_recipes",
    description:
        "Hledej recepty podle diety (diet), typu jídle nebo chodu (meal_type) nebo jména (name). Parametry vyhledávání se dají kombinovat. Užitečné když chcete najít recepty podle konkrétních kritérií.",
    schema: z.object({
        diet: z.string().optional().describe(
            "Vrátí filtrované recepty podle diety nebo kategorie stravování. Možnosti: 'bez laktozy', 'bezlepkové', 'high-protein', 'low-carb', 'masité', 'tučné', 'vegan', 'vegetarian'",
        ),
        meal_type: z.string().optional().describe(
            "Vrátí filtrované recepty podle typu jídla (meal type), Možnosti: desert', 'dochucovadlo', 'hlavní chod', 'polévka', 'pomazánka', 'předkrm', 'příloha', 'salát', 'snídaně'",
        ),
        name: z.string().optional().describe(
            "Vyhledá recepty podle názvu (částečná shoda)",
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
        "Vrátí seznam všech dostupných receptů v databázi. Seznam receptů je příliš dlouhý, proto tento nástroj používej pouze v nezbytných případech",
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
        "Přidá více ingrediencí na nákupní seznam (shoping list). Užitečné při plánování jídel nebo když si uživatelé přejí přidat konkrétní položky.",
    schema: z.object({
        ingredients: z.array(z.string()).describe(
            "Array s názvy ingrediencí k přidání na nákupní seznam",
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
    description: "Vrátí obsah aktuálního nákupního seznamu se všemi položkami.",
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
        "Odstraní všechny položky z nákupního seznamu. Použij, když chce uživatel začít znovu nebo již dokončil nákup.",
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

// TODO: add remove ingredient tool

// Export all MCP tools as an array
export const mcpTools = [
    searchRecipesTool,
    getAllRecipesTool,
    addIngredientsToShoppingListTool,
    getShoppingListTool,
    clearShoppingListTool,
];
