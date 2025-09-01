import { verboseLog } from "../utils/verboseLog.ts";

// Meal type emoji mapping - shared across all functions
const MEAL_EMOJIS = {
    snídaně: "🥐",
    oběd: "🍽️",
    večeře: "🌙",
    svačina: "🍪",
} as const;

// Recipe interface for type safety
export interface Recipe {
    name: string;
    meal_type?: string;
    diet?: string;
    ingredients?: string[];
    steps?: string;
}

export interface MealPlanDay {
    day_name: string;
    meals: Array<{
        meal_type: string;
        recipe_name: string;
    }>;
}

export interface MealPlanResult {
    success: boolean;
    message: string;
    filename?: string;
    stats?: {
        recipesCount: number;
        ingredientsCount: number;
        diet: string;
        days: number;
    };
}

/**
 * Categorizes recipes by meal type for intelligent meal distribution
 */
export function categorizeRecipesByMealType(
    allRecipes: Recipe[],
): Record<string, Recipe[]> {
    const recipesByMealType = {
        snídaně: allRecipes.filter((r: Recipe) =>
            r.meal_type === "snídaně" ||
            r.name?.toLowerCase().includes("snídaně") ||
            r.name?.toLowerCase().includes("breakfast")
        ),
        oběd: allRecipes.filter((r: Recipe) =>
            r.meal_type === "hlavní chod" ||
            r.meal_type === "oběd" ||
            (!r.meal_type?.includes("snídaně") &&
                !r.meal_type?.includes("desert"))
        ),
        večeře: allRecipes.filter((r: Recipe) =>
            r.meal_type === "hlavní chod" ||
            r.meal_type === "večeře" ||
            (!r.meal_type?.includes("snídaně") &&
                !r.meal_type?.includes("desert"))
        ),
        svačina: allRecipes.filter((r: Recipe) =>
            r.meal_type === "desert" ||
            r.meal_type === "svačina" ||
            r.name?.toLowerCase().includes("desert")
        ),
    };

    // Fill in missing categories with general recipes
    const generalRecipes = allRecipes.filter((r: Recipe) =>
        !r.meal_type?.includes("desert") &&
        !r.meal_type?.includes("snídaně")
    );

    Object.keys(recipesByMealType).forEach((mealType) => {
        if (
            recipesByMealType[mealType as keyof typeof recipesByMealType]
                .length === 0
        ) {
            recipesByMealType[mealType as keyof typeof recipesByMealType] = [
                ...generalRecipes,
            ];
        }
    });

    return recipesByMealType;
}

/**
 * Generates meal plan structure by intelligently distributing recipes across days
 */
export function generateMealPlanStructure(
    days: number,
    mealsPerDay: string[],
    recipesByMealType: Record<string, Recipe[]>,
): MealPlanDay[] {
    const mealPlanDays: MealPlanDay[] = [];
    const usedRecipes = new Set<string>();

    for (let dayNum = 1; dayNum <= days; dayNum++) {
        const dayName = `Den ${dayNum}`;
        const dayMeals = [];

        for (const mealType of mealsPerDay) {
            const availableRecipes =
                recipesByMealType[mealType as keyof typeof recipesByMealType]
                    .filter((r: Recipe) => !usedRecipes.has(r.name));

            if (availableRecipes.length > 0) {
                // Pick a random recipe to add variety
                const randomIndex = Math.floor(
                    Math.random() * availableRecipes.length,
                );
                const selectedRecipe = availableRecipes[randomIndex];

                dayMeals.push({
                    meal_type: mealType,
                    recipe_name: selectedRecipe.name,
                });

                usedRecipes.add(selectedRecipe.name);
            } else {
                // Fallback to any available recipe
                const allRecipes = Object.values(recipesByMealType).flat();
                const fallbackRecipes = allRecipes.filter((r: Recipe) =>
                    !usedRecipes.has(r.name)
                );
                if (fallbackRecipes.length > 0) {
                    const selectedRecipe = fallbackRecipes[0];
                    dayMeals.push({
                        meal_type: mealType,
                        recipe_name: selectedRecipe.name,
                    });
                    usedRecipes.add(selectedRecipe.name);
                }
            }
        }

        mealPlanDays.push({
            day_name: dayName,
            meals: dayMeals,
        });
    }

    return mealPlanDays;
}

/**
 * Fetches detailed recipe information for all recipes in the meal plan
 */
export async function fetchRecipeDetails(
    recipeNames: Set<string>,
    baseUrl: string,
): Promise<Map<string, Recipe>> {
    const recipeDetails = new Map<string, Recipe>();
    verboseLog(`📖 Fetching detailed info for ${recipeNames.size} recipes...`);

    for (const recipeName of recipeNames) {
        try {
            const response = await fetch(
                `${baseUrl}/search_recipes?name=${
                    encodeURIComponent(recipeName)
                }`,
            );

            if (response.ok) {
                const data = await response.json();
                if (data.recipes && data.recipes.length > 0) {
                    recipeDetails.set(recipeName, data.recipes[0]);
                } else {
                    console.log(`LOG: No recipe found for "${recipeName}" ⚠️`);
                    recipeDetails.set(recipeName, {
                        name: recipeName,
                        ingredients: [],
                        steps: "Recept nebyl nalezen v databázi.",
                    });
                }
            }
        } catch (error) {
            console.error(`LOG: Error fetching recipe "${recipeName}":`, error);
            recipeDetails.set(recipeName, {
                name: recipeName,
                ingredients: [],
                steps: "Chyba při načítání receptu.",
            });
        }
    }

    return recipeDetails;
}

/**
 * Creates formatted markdown content for the meal plan document
 */
export function createMealPlanDocument(
    title: string,
    searchDiet: string,
    days: number,
    mealsPerDay: string[],
    mealPlanDays: MealPlanDay[],
    recipeDetails: Map<string, Recipe>,
): { content: string; ingredientsCount: number; recipesCount: number } {
    // Create formatted meal plan text
    let mealPlanText = `# ${title}\n\n`;
    mealPlanText +=
        `*Dieta: ${searchDiet} | Počet dní: ${days} | Jídel na den: ${mealsPerDay.length}*\n\n`;

    mealPlanDays.forEach((day) => {
        mealPlanText += `🗓️ **${day.day_name}:**\n`;

        // Sort meals by type for logical ordering
        const mealOrder = ["snídaně", "oběd", "večeře", "svačina"];
        const sortedMeals = day.meals.sort((a, b) => {
            const aIndex = mealOrder.indexOf(a.meal_type);
            const bIndex = mealOrder.indexOf(b.meal_type);
            return aIndex - bIndex;
        });

        sortedMeals.forEach((meal) => {
            const emoji =
                MEAL_EMOJIS[meal.meal_type as keyof typeof MEAL_EMOJIS] || "🍽️";
            const capitalizedMealType = meal.meal_type.charAt(0).toUpperCase() +
                meal.meal_type.slice(1);
            mealPlanText +=
                `  • ${emoji} ${capitalizedMealType}: ${meal.recipe_name}\n`;
        });
        mealPlanText += `\n`;
    });

    mealPlanText += `---\n\n`;
    mealPlanText += `## Recepty\n\n`;

    // Collect all unique recipes that were actually found and add all ingredients for shopping list
    const foundRecipes = new Map();
    const allIngredients = new Set<string>();

    recipeDetails.forEach((recipe, recipeName) => {
        if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
            foundRecipes.set(recipeName, recipe);
            // Collect ingredients for shopping list
            recipe.ingredients.forEach((ingredient: string) => {
                allIngredients.add(ingredient);
            });
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

    // Add timestamp and summary
    mealPlanText += `---\n\n`;
    mealPlanText += `## Shrnutí\n\n`;
    mealPlanText += `- **Celkem receptů:** ${foundRecipes.size}\n`;
    mealPlanText += `- **Celkem ingrediencí:** ${allIngredients.size}\n`;
    mealPlanText += `- **Dieta:** ${searchDiet}\n`;
    mealPlanText += `- **Doba trvání:** ${days} ${
        days === 1 ? "den" : days < 5 ? "dny" : "dní"
    }\n\n`;
    const timestamp = new Date().toLocaleString("cs-CZ");
    mealPlanText += `*Jídelníček vytvořen: ${timestamp}*\n`;

    return {
        content: mealPlanText,
        ingredientsCount: allIngredients.size,
        recipesCount: foundRecipes.size,
    };
}

/**
 * Saves meal plan document to file and returns filename
 */
export async function saveMealPlanDocument(
    content: string,
    days: number,
): Promise<string> {
    // Create plans directory if it doesn't exist at repository root
    const plansDir = "./plans";
    try {
        await Deno.stat(plansDir);
    } catch {
        await Deno.mkdir(plansDir, { recursive: true });
    }

    // Save to file in plans directory with better filename
    const filename = `jidelnicek_${new Date().toLocaleString("cs-CZ")}.md`;
    const filepath = `${plansDir}/${filename}`;
    await Deno.writeTextFile(filepath, content);

    console.log(`💾 Kompletní jídelníček byl uložen jako: plans/${filename}`);
    return filename;
}

/**
 * Adds all ingredients from meal plan to shopping list
 */
export async function addIngredientsToShoppingList(
    recipeDetails: Map<string, Recipe>,
    baseUrl: string,
): Promise<string> {
    const allIngredients = new Set<string>();

    recipeDetails.forEach((recipe) => {
        if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
            recipe.ingredients.forEach((ingredient: string) => {
                allIngredients.add(ingredient);
            });
        }
    });

    if (allIngredients.size === 0) {
        return "";
    }

    try {
        const ingredientsArray = Array.from(allIngredients);
        const response = await fetch(`${baseUrl}/add_ingredients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ingredients: ingredientsArray }),
        });

        if (response.ok) {
            return `\n\n🛒 NÁKUPNÍ SEZNAM AKTUALIZOVÁN:\nPřidáno ${allIngredients.size} ingrediencí na nákupní seznam.\n`;
        }
    } catch (error) {
        return `\n\n⚠️ Nepodařilo se přidat ingredience na nákupní seznam: ${error}`;
    }

    return "";
}

/**
 * Creates user-friendly console output for the created meal plan
 */
export function createMealPlanConsoleOutput(
    title: string,
    filename: string,
    searchDiet: string,
    days: number,
    recipesCount: number,
    ingredientsCount: number,
    mealPlanDays: MealPlanDay[],
    shoppingListResult: string,
): string {
    const consoleOutput = `🎉 JÍDELNÍČEK ÚSPĚŠNĚ VYTVOŘEN!

📅 ${title}
📁 Soubor: plans/${filename}
📊 Statistiky:
   • Dieta: ${searchDiet}
   • Doba: ${days} ${days === 1 ? "den" : days < 5 ? "dny" : "dní"}
   • Recepty: ${recipesCount}
   • Ingredience: ${ingredientsCount}

🗓️ PŘEHLED JÍDELNÍČKU:
${
        mealPlanDays.map((day) => {
            let dayText = `${day.day_name}:\n`;
            const mealOrder = ["snídaně", "oběd", "večeře", "svačina"];
            const sortedMeals = day.meals.sort((a, b) => {
                const aIndex = mealOrder.indexOf(a.meal_type);
                const bIndex = mealOrder.indexOf(b.meal_type);
                return aIndex - bIndex;
            });

            sortedMeals.forEach((meal) => {
                const emoji =
                    MEAL_EMOJIS[meal.meal_type as keyof typeof MEAL_EMOJIS] ||
                    "🍽️";
                const capitalizedType = meal.meal_type.charAt(0).toUpperCase() +
                    meal.meal_type.slice(1);
                dayText +=
                    `  ${emoji} ${capitalizedType}: ${meal.recipe_name}\n`;
            });
            return dayText;
        }).join("\n")
    }

💾 Kompletní jídelníček s recepty a postupy byl uložen do souboru plans/${filename}${shoppingListResult}

💡 Co můžeš dělat dál:
   • Zobrazit nákupní seznam: get_shopping_list
   • Upravit jídelníček: "Nahraď recept pro den 2"
   • Najít více receptů: search_recipes_by_diet`;

    return consoleOutput;
}
