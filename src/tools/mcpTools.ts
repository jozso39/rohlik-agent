// mcpTools.mts - Custom tools for the Shopping List MCP Server

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Base URL for the MCP server
const MCP_BASE_URL = process.env.MCP_BASE_URL || "http://localhost:8001";

// Tool for searching recipes
export const searchRecipesTool = new DynamicStructuredTool({
    name: "search_recipes",
    description:
        "Hledej recepty podle diety (diet), typu jídle nebo chodu (meal_type) nebo jména (name). Parametry vyhledávání se dají kombinovat." +
        "Užitečné když chcete najít recepty podle konkrétních kritérií." +
        "Pokud nenajdeš žádné recepty, můžeš použít endpoint /get_all_recipes",
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
    description: "Vrátí seznam všech dostupných receptů v databázi." +
        "Seznam receptů je příliš dlouhý, proto tento nástroj používej pouze pokud nenajdeš žádné recepty přes endpoint /search_recipes",
    schema: z.object({}),
    func: async () => {
        try {
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

// Tool for removing ingredients from shopping list
export const removeIngredientsFromShoppingListTool = new DynamicStructuredTool({
    name: "remove_ingredients_from_shopping_list",
    description:
        "Odstraní specifické ingredience z nákupního seznamu. Ingredience, které nejsou v seznamu, budou ignorovány. Užitečné pro úpravu nákupního seznamu nebo když se uživatel rozhodne některé položky nechtít.",
    schema: z.object({
        ingredients: z.array(z.string()).describe(
            "Array s názvy ingrediencí k odstranění z nákupního seznamu",
        ),
    }),
    func: async ({ ingredients }) => {
        try {
            const response = await fetch(`${MCP_BASE_URL}/remove_ingredients`, {
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
            return `Error removing ingredients: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Tool for creating structured meal plans
export const createMealPlanTool = new DynamicStructuredTool({
    name: "create_meal_plan",
    description:
        "Vytvoří strukturovaný jídelníček na více dní a uloží ho jako markdown soubor. Použij tento nástroj po vytvoření jídelníčku na několik dní dopředu.",
    schema: z.object({
        title: z.string().describe(
            "Název jídelníčku (např. 'Vegetariánský jídelníček na týden')",
        ),
        days: z.array(z.object({
            day_name: z.string().describe(
                "Název dne (např. 'Den 1 - Pondělí')",
            ),
            breakfast: z.string().optional().describe(
                "Název receptu na snídani",
            ),
            lunch: z.string().describe("Název receptu na oběd"),
            dinner: z.string().describe("Název receptu na večeři"),
            snacks: z.array(z.string()).optional().describe(
                "Volitelné svačiny/dezerty",
            ),
        })).describe("Array objektů pro jednotlivé dny"),
    }),
    func: async ({ title, days }) => {
        try {
            // Collect all unique recipe names from the meal plan
            const allRecipeNames = new Set<string>();

            days.forEach((day) => {
                if (day.breakfast) allRecipeNames.add(day.breakfast);
                allRecipeNames.add(day.lunch);
                allRecipeNames.add(day.dinner);
                if (day.snacks) {
                    day.snacks.forEach((snack) => allRecipeNames.add(snack));
                }
            });

            console.log(
                `LOG: fetching ${allRecipeNames.size} unique recipes from MCP server 🔍`,
            );

            // Fetch complete recipe details for each unique recipe
            const recipeDetails = new Map();

            for (const recipeName of allRecipeNames) {
                try {
                    const response = await fetch(
                        `${MCP_BASE_URL}/search_recipes?name=${
                            encodeURIComponent(recipeName)
                        }`,
                    );

                    if (response.ok) {
                        const data = await response.json();
                        if (data.recipes && data.recipes.length > 0) {
                            // Take the first matching recipe
                            recipeDetails.set(recipeName, data.recipes[0]);
                        } else {
                            console.log(
                                `LOG: No recipe found for "${recipeName}" ⚠️`,
                            );
                            // Create a placeholder if recipe not found
                            recipeDetails.set(recipeName, {
                                name: recipeName,
                                ingredients: [],
                                steps: "Recept nebyl nalezen v databázi.",
                            });
                        }
                    }
                } catch (error) {
                    console.error(
                        `LOG: Error fetching recipe "${recipeName}":`,
                        error,
                    );
                    recipeDetails.set(recipeName, {
                        name: recipeName,
                        ingredients: [],
                        steps: "Chyba při načítání receptu.",
                    });
                }
            }

            // Create formatted meal plan text with complete recipes
            let mealPlanText = `# ${title}\n\n`;

            days.forEach((day, index) => {
                mealPlanText += `## ${day.day_name}\n\n`;

                // Helper function to format recipe with complete details
                const formatRecipe = (recipeName: string, mealType: string) => {
                    const recipe = recipeDetails.get(recipeName);
                    if (!recipe) {
                        return `### ${mealType}: ${recipeName}\n\n*Recept nebyl nalezen.*\n\n`;
                    }

                    let recipeText = `### ${mealType}: ${recipe.name}\n\n`;

                    if (recipe.ingredients && recipe.ingredients.length > 0) {
                        recipeText += `**Ingredience:**\n`;
                        recipe.ingredients.forEach((ingredient: string) => {
                            recipeText += `- ${ingredient}\n`;
                        });
                        recipeText += `\n`;
                    }

                    if (recipe.steps) {
                        recipeText += `**Postup:**\n${recipe.steps}\n\n`;
                    }

                    return recipeText;
                };

                if (day.breakfast) {
                    mealPlanText += formatRecipe(day.breakfast, "🥐 Snídaně");
                }

                mealPlanText += formatRecipe(day.lunch, "🍽️ Oběd");
                mealPlanText += formatRecipe(day.dinner, "🌙 Večeře");

                if (day.snacks && day.snacks.length > 0) {
                    day.snacks.forEach((snackName: string) => {
                        mealPlanText += formatRecipe(
                            snackName,
                            "🍪 Svačina/Desert",
                        );
                    });
                }

                mealPlanText += `---\n\n`;
            });

            // Add timestamp
            const timestamp = new Date().toLocaleString("cs-CZ");
            mealPlanText += `*Jídelníček vytvořen: ${timestamp}*\n`;

            // Create plans directory if it doesn't exist
            const plansDir = join(process.cwd(), "plans");
            if (!existsSync(plansDir)) {
                mkdirSync(plansDir, { recursive: true });
            }

            // Save to file in plans directory
            const filename = `jidelnicek_${Date.now()}.md`;
            const filepath = join(plansDir, filename);
            writeFileSync(filepath, mealPlanText, "utf-8");
            console.log(
                `LOG: meal plan saved with ${allRecipeNames.size} complete recipes 💾`,
            );

            // Create console output (simplified - no recipe steps)
            const consoleOutput = `📅 JÍDELNÍČEK: ${title}\n\n` +
                days.map((day) => {
                    let dayText = `🗓️ ${day.day_name}:\n`;
                    if (day.breakfast) {
                        dayText += `  • Snídaně: ${day.breakfast}\n`;
                    }
                    dayText += `  • Oběd: ${day.lunch}\n`;
                    dayText += `  • Večeře: ${day.dinner}\n`;
                    if (day.snacks && day.snacks.length > 0) {
                        dayText += `  • Svačiny: ${day.snacks.join(", ")}\n`;
                    }
                    return dayText;
                }).join("\n") +
                `\n💾 Kompletní jídelníček s ${allRecipeNames.size} recepty uložen jako: plans/${filename}\n`;

            return consoleOutput;
        } catch (error) {
            return `Error creating meal plan: ${
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
    removeIngredientsFromShoppingListTool,
    getShoppingListTool,
    clearShoppingListTool,
    createMealPlanTool,
];
