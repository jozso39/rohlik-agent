import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

const MCP_BASE_URL = Deno.env.get("MCP_BASE_URL") || "http://localhost:8001";

const showExistingRecipeNames = async (MCP_BASE_URL: string) => {
    const response = await fetch(
        `${MCP_BASE_URL}/get_recipe_names`,
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Format the response for better user experience
    const guidance = {
        message: "📋 Dostupné názvy receptů:",
        count: data.count,
        recipe_names: data.recipe_names,
        next_step:
            "Vyber si konkrétní název receptu z tohoto seznamu a použij jej v parametru 'name' pro vyhledání receptu.",
    };

    return JSON.stringify(guidance, null, 2);
};

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
                return showExistingRecipeNames(MCP_BASE_URL);
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

                const data = await response.json();

                // FALLBACK: If no recipes found, show available recipe names
                if (!data.recipes || data.recipes.length === 0) {
                    try {
                        const namesResponse = await fetch(
                            `${MCP_BASE_URL}/get_recipe_names`,
                        );

                        if (namesResponse.ok) {
                            const namesData = await namesResponse.json();

                            // Instead of showing all recipes to the agent, let's do basic filtering first
                            // and only pass a manageable subset for intelligent analysis
                            const searchTerm = name.toLowerCase();

                            // Basic filtering to reduce the list before sending to agent
                            const relevantRecipes = namesData.recipe_names
                                .filter((recipeName: string) => {
                                    const recipeNameLower = recipeName
                                        .toLowerCase();
                                    // Check for partial matches or common word fragments
                                    return recipeNameLower.includes(
                                        searchTerm,
                                    ) ||
                                        searchTerm.includes(recipeNameLower) ||
                                        // Check individual words for broader matching
                                        searchTerm.split(/\s+/).some((word) =>
                                            word.length >= 3 &&
                                            recipeNameLower.includes(word)
                                        ) ||
                                        recipeNameLower.split(/\s+/).some(
                                            (word) =>
                                                word.length >= 3 &&
                                                searchTerm.includes(word),
                                        );
                                }).slice(0, 20); // Limit to max 20 for agent analysis

                            if (relevantRecipes.length > 0) {
                                // Found some potentially relevant recipes - let agent analyze them
                                const fallbackResponse = {
                                    task: "intelligent_recipe_matching",
                                    message:
                                        `❌ Nenašel jsem přesný recept "${name}"`,
                                    search_attempted: name,
                                    available_recipes: {
                                        count: relevantRecipes.length,
                                        recipe_names: relevantRecipes,
                                        note:
                                            `Zobrazuji ${relevantRecipes.length} nejrelevantnějších receptů z celkového počtu ${namesData.count}`,
                                    },
                                    agent_instruction:
                                        `Proanalyzuj tyto recepty a najdi ty, které nejlépe odpovídají hledanému "${name}". 
                                    Uvažuj o synonymech, podobných pokrmech a variantách.
                                    Vrať maximálně 3-5 nejlepších návrhů s krátkým vysvětlením, proč jsou relevantní.`,
                                    next_step:
                                        "Agent analyzuje vyfiltrované recepty a navrhne nejlepší shody.",
                                };
                                return JSON.stringify(
                                    fallbackResponse,
                                    null,
                                    2,
                                );
                            } else {
                                // No relevant recipes found - suggest alternative approach
                                // TODO: use tavily search fallback to look for similar recipes and compare this with the list of existing recipes
                                const fallbackResponse = {
                                    message:
                                        `❓ Nenašel jsem recepty podobné "${name}"`,
                                    search_attempted: name,
                                    suggestion:
                                        "Tento recept není v naší databázi. Zkus:",
                                    alternatives: [
                                        "Použít obecnější termíny (např. 'polévka', 'hlavní chod', 'desert')",
                                        "Hledat podle ingrediencí které používá tento pokrm",
                                        "Hledat podle typu kuchyně nebo diety",
                                    ],
                                    next_step:
                                        "Nebo řekni mi více o tom, jaký typ jídla hledáš a já ti navrhnu podobné recepty.",
                                };
                                return JSON.stringify(
                                    fallbackResponse,
                                    null,
                                    2,
                                );
                            }
                        }
                    } catch (fallbackError) {
                        console.error(
                            "Fallback to get_recipe_names failed:",
                            fallbackError,
                        );
                    }

                    // If fallback also fails, return original empty result with guidance
                    return JSON.stringify(
                        {
                            ...data,
                            fallback_message:
                                `Nenašel jsem recept "${name}". Zkus použít show_available_names: true pro zobrazení dostupných názvů.`,
                        },
                        null,
                        2,
                    );
                }

                // SUCCESS: Recipes found, handle pagination info
                if (data.pagination) {
                    const { pagination } = data;
                    let paginationInfo =
                        `\n📄 Stránka ${pagination.page} z ${pagination.total_pages} (celkem ${pagination.total} receptů)`;

                    if (pagination.has_next) {
                        paginationInfo +=
                            `\n➡️ Pro další recepty použij page: ${
                                pagination.page + 1
                            }`;
                    }
                    if (pagination.has_prev) {
                        paginationInfo +=
                            `\n⬅️ Pro předchozí recepty použij page: ${
                                pagination.page - 1
                            }`;
                    }

                    // Add pagination info to the response
                    data.pagination_info = paginationInfo;
                }

                return JSON.stringify(data, null, 2);
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

            const data = await response.json();

            // Handle pagination info for better user experience
            if (data.pagination) {
                const { pagination } = data;
                let paginationInfo =
                    `\n📄 Stránka ${pagination.page} z ${pagination.total_pages} (celkem ${pagination.total} receptů)`;

                if (pagination.has_next) {
                    paginationInfo += `\n➡️ Pro další recepty použij page: ${
                        pagination.page + 1
                    }`;
                }
                if (pagination.has_prev) {
                    paginationInfo +=
                        `\n⬅️ Pro předchozí recepty použij page: ${
                            pagination.page - 1
                        }`;
                }

                // Add pagination info to the response
                data.pagination_info = paginationInfo;
            }

            return JSON.stringify(data, null, 2);
        } catch (error) {
            return `Error searching recipes: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Tool for getting all available ingredients
const getAllIngredientsTool = new DynamicStructuredTool({
    name: "get_all_ingredients",
    description:
        "Vrátí seznam všech dostupných ingrediencí z databáze receptů. Užitečné pro zjištění, které ingredience jsou k dispozici nebo pro návrhy ingrediencí uživateli.",
    schema: z.object({}),
    func: async () => {
        try {
            const response = await fetch(`${MCP_BASE_URL}/get_all_ingredients`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return `Error getting ingredients: ${
                error instanceof Error ? error.message : "Unknown error"
            }`;
        }
    },
});

// Tool for getting all available diet types
const getAllDietsTool = new DynamicStructuredTool({
    name: "get_all_diets",
    description:
        "Vrátí seznam všech dostupných typů diet z databáze receptů. Užitečné pro zjištění dostupných dietních kategorií nebo pro návrhy uživateli.",
    schema: z.object({}),
    func: async () => {
        try {
            const response = await fetch(`${MCP_BASE_URL}/get_all_diets`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return `Error getting diets: ${
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

// Tool for creating structured meal plans
const createMealPlanTool = new DynamicStructuredTool({
    name: "create_meal_plan",
    description:
        "Vytvoří strukturovaný jídelníček na více dní a uloží ho jako markdown soubor. Použij tento nástroj po vytvoření jídelníčku na několik dní dopředu.",
    schema: z.object({
        title: z
            .string()
            .describe(
                "Název jídelníčku (např. 'Vegetariánský jídelníček na týden')",
            ),
        days: z
            .array(
                z.object({
                    day_name: z
                        .string()
                        .describe("Název dne (např. 'Den 1 - Pondělí')"),
                    meals: z
                        .array(
                            z.object({
                                meal_type: z
                                    .enum([
                                        "snídaně",
                                        "oběd",
                                        "večeře",
                                        "svačina",
                                    ])
                                    .describe(
                                        "Typ jídla - snídaně, oběd, večeře nebo svačina",
                                    ),
                                recipe_name: z
                                    .string()
                                    .describe("Název receptu"),
                            }),
                        )
                        .describe("Seznam jídel pro daný den"),
                }),
            )
            .describe("Array objektů pro jednotlivé dny"),
    }),
    func: async ({ title, days }) => {
        // Meal type emoji mapping
        const mealEmojis = {
            snídaně: "🥐",
            oběd: "🍽️",
            večeře: "🌙",
            svačina: "🍪",
        };
        try {
            // Collect all unique recipe names from the meal plan
            const allRecipeNames = new Set<string>();

            days.forEach((day) => {
                day.meals.forEach((meal) => {
                    allRecipeNames.add(meal.recipe_name);
                });
            });

            // Fetch complete recipe details for each unique recipe
            const recipeDetails = new Map();

            for (const recipeName of allRecipeNames) {
                try {
                    const response = await fetch(
                        `${MCP_BASE_URL}/search_recipes?name=${
                            encodeURIComponent(
                                recipeName,
                            )
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

            // Create formatted meal plan text
            let mealPlanText = `# ${title}\n\n`;
            days.forEach((day) => {
                mealPlanText += `🗓️ **${day.day_name}:**\n`;

                // Sort meals by type for logical ordering
                const mealOrder = ["snídaně", "oběd", "večeře", "svačina"];
                const sortedMeals = day.meals.sort((a, b) => {
                    const aIndex = mealOrder.indexOf(a.meal_type);
                    const bIndex = mealOrder.indexOf(b.meal_type);
                    return aIndex - bIndex;
                });

                sortedMeals.forEach((meal) => {
                    const emoji = mealEmojis[meal.meal_type] || "🍽️";
                    const capitalizedMealType =
                        meal.meal_type.charAt(0).toUpperCase() +
                        meal.meal_type.slice(1);
                    mealPlanText +=
                        `  • ${emoji} ${capitalizedMealType}: ${meal.recipe_name}\n`;
                });
                mealPlanText += `\n`;
            });

            mealPlanText += `---\n\n`;
            mealPlanText += `## Recepty\n\n`;

            // Second section: Detailed recipes
            // Collect all unique recipes that were actually found
            const foundRecipes = new Map();
            allRecipeNames.forEach((recipeName) => {
                const recipe = recipeDetails.get(recipeName);
                if (
                    recipe &&
                    recipe.ingredients &&
                    recipe.ingredients.length > 0
                ) {
                    foundRecipes.set(recipeName, recipe);
                }
            });

            // Generate detailed recipe sections
            foundRecipes.forEach((recipe) => {
                mealPlanText += `### ${recipe.name}\n\n`;

                if (recipe.ingredients && recipe.ingredients.length > 0) {
                    mealPlanText += `**Ingredience:**\n`;
                    recipe.ingredients.forEach((ingredient: string) => {
                        mealPlanText += `- ${ingredient}\n`;
                    });
                    mealPlanText += `\n`;
                }

                if (recipe.steps) {
                    mealPlanText += `**Postup:**\n${recipe.steps}\n\n`;
                }
            });

            // Add timestamp
            const timestamp = new Date().toLocaleString("cs-CZ");
            mealPlanText += `*Jídelníček vytvořen: ${timestamp}*\n`;

            // Create plans directory if it doesn't exist at repository root
            const plansDir = "./plans";
            try {
                await Deno.stat(plansDir);
            } catch {
                await Deno.mkdir(plansDir, { recursive: true });
            }

            // Save to file in plans directory
            const filename = `jidelnicek_${timestamp}.md`;
            const filepath = `${plansDir}/${filename}`;
            await Deno.writeTextFile(filepath, mealPlanText);
            console.log(
                `💾 Kompletní jídelníček s ${allRecipeNames.size} recepty byl uložen jako: plans/${filename}`,
            );

            // Create console output (simplified - no recipe steps)
            const consoleOutput = `📅 JÍDELNÍČEK: ${title}\n\n${
                days
                    .map((day) => {
                        let dayText = `🗓️ ${day.day_name}:\n`;

                        // Group meals by type for cleaner display
                        const mealsByType = day.meals.reduce(
                            (acc, meal) => {
                                if (!acc[meal.meal_type]) {
                                    acc[meal.meal_type] = [];
                                }
                                acc[meal.meal_type].push(meal.recipe_name);
                                return acc;
                            },
                            {} as Record<string, string[]>,
                        );

                        // Display meals in preferred order
                        const mealOrder = [
                            "snídaně",
                            "oběd",
                            "večeře",
                            "svačina",
                        ];
                        mealOrder.forEach((mealType) => {
                            if (mealsByType[mealType]) {
                                const capitalizedType =
                                    mealType.charAt(0).toUpperCase() +
                                    mealType.slice(1);
                                dayText += `  • ${capitalizedType}: ${
                                    mealsByType[
                                        mealType
                                    ].join(", ")
                                }\n`;
                            }
                        });

                        return dayText;
                    })
                    .join("\n")
            }`;

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
    searchRecipesByRecipeNameTool,
    searchRecipesTool,
    getAllIngredientsTool,
    getAllDietsTool,
    addIngredientsToShoppingListTool,
    removeIngredientsFromShoppingListTool,
    getShoppingListTool,
    clearShoppingListTool,
    createMealPlanTool,
];
