import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import {
    addPaginationInfo,
    fetchAllRecipeNames,
    fetchRecipesByDietWithPagination,
    handleDietSearch,
    handleIngredientSearch,
    handleRecipeSearchFallback,
    type RecipeSearchData,
} from "./recipeSearchHelpers.ts";
import {
    addIngredientsToShoppingList,
    categorizeRecipesByMealType,
    createMealPlanConsoleOutput,
    createMealPlanDocument,
    fetchRecipeDetails,
    generateMealPlanStructure,
    type Recipe,
    saveMealPlanDocument,
} from "./mealPlanHelpers.ts";

const MCP_BASE_URL = Deno.env.get("MCP_BASE_URL") || "http://localhost:8001";

// Tool for searching recipes by name with guided discovery
const searchRecipesByRecipeNameTool = new DynamicStructuredTool({
    name: "search_recipes_by_recipe_name",
    description: "Implementuje workflow pro vyhledávání receptů podle názvu. " +
        "PRVNÍ KROK: Pokud uživatel chce recepty podle názvu, ale nespecifikoval konkrétní název, nastav 'show_available_names' na true pro zobrazení všech dostupných názvů receptů. " +
        "DRUHÝ KROK: Poté co uživatel vybere konkrétní název z seznamu, hledej podle tohoto názvu. " +
        "DŮLEŽITÉ!!!: NIKDY NEVYPISUJ UŽIVATELI CELÝ SEZNAM RECEPTŮ! JE PŘÍLIŠ DLOUHÝ! " +
        "Podporuje částečnou shodu a stránkování výsledků (max 10 receptů na stránku).",
    schema: z.object({
        show_available_names: z
            .boolean()
            .optional()
            .describe(
                "Nastav na true pro zobrazení všech dostupných názvů receptů jako první krok",
            ),
        name: z
            .string()
            .optional()
            .describe(
                "Konkrétní název receptu pro vyhledání (použij po zobrazení dostupných názvů)",
            ),
        page: z
            .number()
            .optional()
            .describe(
                "Číslo stránky pro stránkování výsledků (výchozí: 1, max 10 receptů na stránku)",
            ),
    }),
    func: async ({ show_available_names, name, page }) => {
        try {
            // STEP 1: Show available recipe names if requested
            if (show_available_names && !name) {
                try {
                    const namesData = await fetchAllRecipeNames(MCP_BASE_URL);
                    return JSON.stringify(
                        {
                            message:
                                `📋 K dispozici je ${namesData.count} receptů`,
                            available_recipe_names: namesData.recipe_names,
                            instruction:
                                "Vyber si konkrétní název receptu a použij parametr 'name' pro vyhledání.",
                            note:
                                "POZOR: Seznam je dlouhý - použij Ctrl+F pro rychlé hledání konkrétního názvu.",
                        },
                        null,
                        2,
                    );
                } catch (error) {
                    return `Error fetching recipe names: ${
                        error instanceof Error ? error.message : "Unknown error"
                    }`;
                }
            }

            // STEP 2: Search by specific recipe name
            if (name) {
                const params = new URLSearchParams();
                params.append("name", name);
                if (page) params.append("page", page.toString());

                const response = await fetch(
                    `${MCP_BASE_URL}/search_recipes?${params.toString()}`,
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json() as RecipeSearchData;

                // FALLBACK: If no recipes found, use intelligent recipe matching
                if (!data.recipes || data.recipes.length === 0) {
                    return await handleRecipeSearchFallback(
                        name,
                        MCP_BASE_URL,
                        data,
                    );
                }

                // SUCCESS: Recipes found, add pagination info and return
                const dataWithPagination = addPaginationInfo(data);
                return JSON.stringify(dataWithPagination, null, 2);
            }

            // ERROR: Neither option was used correctly
            return JSON.stringify(
                {
                    error:
                        "Musíš použít buď 'show_available_names: true' pro zobrazení dostupných názvů, nebo 'name' pro vyhledání konkrétního receptu.",
                    workflow:
                        "1. Nejdříve nastav show_available_names: true\n2. Pak použij konkrétní název z seznamu v parametru name",
                },
                null,
                2,
            );
        } catch (error) {
            return `Error in recipe name workflow: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

const searchRecipesByIngredientsTool = new DynamicStructuredTool({
    name: "search_recipes_by_ingredients",
    description:
        "Hledej recepty podle ingrediencí s inteligentním fallbackem. " +
        "PRVNÍ POKUS: Nejdříve hledej přímo podle zadané ingredience. " +
        "FALLBACK: Pokud nenajde žádné recepty, zobrazí dostupné ingredience pro nalezení podobných názvů. " +
        "Použij když uživatel hledá recepty s konkrétní ingrediencí (např. 'najdi mi recept se sýrem Gruyere').",
    schema: z.object({
        ingredient: z
            .string()
            .describe(
                "Název ingredience pro vyhledání receptů (např. 'Gruyere', 'česnek', 'rajčata')",
            ),
        fallback_ingredient: z
            .string()
            .optional()
            .describe(
                "Přesný název ingredience z seznamu dostupných ingrediencí (použij po fallbacku když první pokus neuspěl)",
            ),
        page: z
            .number()
            .optional()
            .describe(
                "Číslo stránky pro stránkování výsledků (výchozí: 1, max 10 receptů na stránku)",
            ),
    }),
    func: async ({ ingredient, fallback_ingredient, page }) => {
        try {
            return await handleIngredientSearch(
                ingredient,
                fallback_ingredient,
                page,
                MCP_BASE_URL,
            );
        } catch (error) {
            return `Error in ingredient search workflow: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Tool for searching recipes by diet with intelligent fallback
const searchRecipesByDietTool = new DynamicStructuredTool({
    name: "search_recipes_by_diet",
    description:
        "Hledej recepty podle diety s inteligentním fallbackem a podporou stránkování. " +
        "PRVNÍ POKUS: Nejdříve hledej přímo podle zadané diety. " +
        "STRÁNKOVÁNÍ: Pokud agent nenajde dostatek receptů, může listovat dalšími stránkami. " +
        "FALLBACK: Pokud nenajde žádné recepty, zobrazí dostupné diety pro nalezení podobných názvů. " +
        "Použij když uživatel hledá recepty podle diety (např. 'najdi mi vegetariánské recepty', 'bezlepkové jídlo').",
    schema: z.object({
        diet: z
            .string()
            .describe(
                "Název diety pro vyhledání receptů (např. 'vegetarian', 'bezlepkové', 'vegan')",
            ),
        fallback_diet: z
            .string()
            .optional()
            .describe(
                "Přesný název diety z seznamu dostupných diet (použij po fallbacku když první pokus neuspěl)",
            ),
        page: z
            .number()
            .optional()
            .describe(
                "Číslo stránky pro stránkování výsledků (výchozí: 1, max 10 receptů na stránku). Použij pro listování dalšími stránkami.",
            ),
    }),
    func: async ({ diet, fallback_diet, page }) => {
        try {
            return await handleDietSearch(
                diet,
                fallback_diet,
                page,
                MCP_BASE_URL,
            );
        } catch (error) {
            return `Error in diet search workflow: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Tool for searching recipes by criteria (excluding name)
const searchRecipesTool = new DynamicStructuredTool({
    name: "search_recipes",
    description:
        "Hledej recepty podle diety (diet), typu jídle nebo chodu (meal_type), nebo ingrediencí. Parametry vyhledávání se dají kombinovat. " +
        "Podporuje filtrování podle ingrediencí které mají/nemají být v receptu a stránkování výsledků (max 10 receptů na stránku). " +
        "Vrací recepty s informacemi o stránkování - pokud je více výsledků, použij parametr 'page' pro načtení dalších stránek. " +
        "Pro vyhledávání podle názvu použij search_recipes_by_name.",
    schema: z.object({
        diet: z
            .string()
            .optional()
            .describe(
                "Vrátí filtrované recepty podle diety nebo kategorie stravování. Možnosti: 'bez laktozy', 'bezlepkové', 'high-protein', 'low-carb', 'masité', 'tučné', 'vegan', 'vegetarian'",
            ),
        meal_type: z
            .string()
            .optional()
            .describe(
                "Vrátí filtrované recepty podle typu jídla (meal type), Možnosti: 'desert', 'dochucovadlo', 'hlavní chod', 'polévka', 'pomazánka', 'předkrm', 'příloha', 'salát', 'snídaně'",
            ),
        includes_ingredients: z
            .string()
            .optional()
            .describe(
                "Seznam ingrediencí oddělených čárkou, které MUSÍ být v receptu (např. 'Cibule,Máslo,Česnek')",
            ),
        excludes_ingredients: z
            .string()
            .optional()
            .describe(
                "Seznam ingrediencí oddělených čárkou, které NESMÍ být v receptu (např. 'Mléko,Vejce')",
            ),
        page: z
            .number()
            .optional()
            .describe(
                "Číslo stránky pro stránkování výsledků (výchozí: 1, max 10 receptů na stránku)",
            ),
    }),
    func: async (
        {
            diet,
            meal_type,
            includes_ingredients,
            excludes_ingredients,
            page,
        },
    ) => {
        try {
            const params = new URLSearchParams();
            if (diet) params.append("diet", diet);
            if (meal_type) params.append("meal_type", meal_type);
            if (includes_ingredients) {
                params.append("includes_ingredients", includes_ingredients);
            }
            if (excludes_ingredients) {
                params.append("excludes_ingredients", excludes_ingredients);
            }
            if (page) params.append("page", page.toString());

            const response = await fetch(
                `${MCP_BASE_URL}/search_recipes?${params.toString()}`,
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as RecipeSearchData;

            // Handle pagination info for better user experience using helper
            const dataWithPagination = addPaginationInfo(data);
            return JSON.stringify(dataWithPagination, null, 2);
        } catch (error) {
            return `Error searching recipes: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Tool for adding ingredients to shopping list
const addIngredientsToShoppingListTool = new DynamicStructuredTool({
    name: "add_ingredients_to_shopping_list",
    description:
        "Přidá více ingrediencí na nákupní seznam (shoping list). Užitečné při plánování jídel nebo když si uživatelé přejí přidat konkrétní položky.",
    schema: z.object({
        ingredients: z
            .array(z.string())
            .describe("Array s názvy ingrediencí k přidání na nákupní seznam"),
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
const getShoppingListTool = new DynamicStructuredTool({
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
const removeIngredientsFromShoppingListTool = new DynamicStructuredTool({
    name: "remove_ingredients_from_shopping_list",
    description:
        "Odstraní specifické ingredience z nákupního seznamu. Ingredience, které nejsou v seznamu, budou ignorovány. Užitečné pro úpravu nákupního seznamu nebo když se uživatel rozhodne některé položky nechtít.",
    schema: z.object({
        ingredients: z
            .array(z.string())
            .describe(
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

// Tool for creating meal plans from diet with intelligent recipe selection
const createMealPlanFromDietTool = new DynamicStructuredTool({
    name: "create_meal_plan_from_diet",
    description: "Vytvoří kompletní jídelníček na základě diety a počtu dní. " +
        "INTELIGENTNÍ WORKFLOW: 1) Automaticky vyhledá recepty podle zadané diety " +
        "2) Inteligentně vybere vhodné recepty pro každý typ jídla (snídaně, oběd, večeře, svačina) " +
        "3) Vytvoří strukturovaný dokument s kompletním jídelníčkem včetně všech ingrediencí a postupů " +
        "4) Volitelně přidá všechny ingredience na nákupní seznam " +
        "Toto je hlavní nástroj pro vytváření jídelníčků podle požadavků z ASSIGNMENT.md!",
    schema: z.object({
        diet: z
            .string()
            .describe(
                "Název diety pro vyhledání receptů (např. 'vegetarian', 'vegan', 'bezlepkové', 'low-carb')",
            ),
        days: z
            .number()
            .min(1)
            .max(14)
            .describe("Počet dní jídelníčku (1-14 dní)"),
        meals_per_day: z
            .array(z.enum(["snídaně", "oběd", "večeře", "svačina"]))
            .describe(
                "Typy jídel pro každý den (např. ['snídaně', 'oběd', 'večeře'] nebo ['oběd', 'večeře'])",
            ),
        title: z
            .string()
            .optional()
            .describe(
                "Vlastní název jídelníčku (pokud není zadán, vytvoří se automaticky)",
            ),
        add_to_shopping_list: z
            .boolean()
            .optional()
            .describe(
                "Zda přidat všechny ingredience z jídelníčku do nákupního seznamu (výchozí: false)",
            ),
        fallback_diet: z
            .string()
            .optional()
            .describe(
                "Přesný název diety z seznamu dostupných diet (použij po fallbacku když první pokus neuspěl)",
            ),
    }),
    func: async ({
        diet,
        days,
        meals_per_day,
        title,
        add_to_shopping_list = false,
        fallback_diet,
    }) => {
        try {
            // Search for recipes using the diet search workflow
            const searchResult = await fetchRecipesByDietWithPagination(
                diet,
                fallback_diet,
                MCP_BASE_URL,
                days * meals_per_day.length * 2, // Get enough recipes for variety
            );

            // Check if we got a fallback response (no recipes found)
            if ("fallbackResponse" in searchResult) {
                return searchResult.fallbackResponse;
            }

            const { recipes: allRecipes, searchDiet } = searchResult;

            if (allRecipes.length === 0) {
                return `❌ Nepodařilo se najít žádné recepty pro dietu "${searchDiet}". Zkus použít jiný název diety nebo použij search_recipes_by_diet pro zobrazení dostupných diet.`;
            }

            // Categorize recipes by meal type for intelligent distribution
            const recipesByMealType = categorizeRecipesByMealType(
                allRecipes as Recipe[],
            );

            // Generate meal plan structure
            const mealPlanDays = generateMealPlanStructure(
                days,
                meals_per_day,
                recipesByMealType,
            );

            // Create the document title
            const mealPlanTitle = title ||
                `${
                    searchDiet.charAt(0).toUpperCase() + searchDiet.slice(1)
                } jídelníček na ${days} ${
                    days === 1 ? "den" : days < 5 ? "dny" : "dní"
                }`;

            // Collect all unique recipe names and fetch detailed information
            const allRecipeNames = new Set<string>();
            mealPlanDays.forEach((day) => {
                day.meals.forEach((meal) => {
                    allRecipeNames.add(meal.recipe_name);
                });
            });

            const recipeDetails = await fetchRecipeDetails(
                allRecipeNames,
                MCP_BASE_URL,
            );

            // Create the formatted meal plan document
            const { content, ingredientsCount, recipesCount } =
                createMealPlanDocument(
                    mealPlanTitle,
                    searchDiet,
                    days,
                    meals_per_day,
                    mealPlanDays,
                    recipeDetails,
                );

            // Save the document to file
            const filename = await saveMealPlanDocument(content);

            // Optionally add ingredients to shopping list
            let shoppingListResult = "";
            if (add_to_shopping_list) {
                shoppingListResult = await addIngredientsToShoppingList(
                    recipeDetails,
                    MCP_BASE_URL,
                );
            }

            // Create user-friendly console output
            const consoleOutput = createMealPlanConsoleOutput(
                mealPlanTitle,
                filename,
                searchDiet,
                days,
                recipesCount,
                ingredientsCount,
                mealPlanDays,
                shoppingListResult,
            );

            return consoleOutput;
        } catch (error) {
            return `❌ Chyba při vytváření jídelníčku: ${
                error instanceof Error ? error.message : "Neznámá chyba"
            }`;
        }
    },
});

// Export all MCP tools as an array
export const mcpTools = [
    searchRecipesByRecipeNameTool,
    searchRecipesByIngredientsTool,
    searchRecipesByDietTool,
    searchRecipesTool,
    addIngredientsToShoppingListTool,
    removeIngredientsFromShoppingListTool,
    getShoppingListTool,
    clearShoppingListTool,
    createMealPlanFromDietTool,
];
