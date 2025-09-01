export interface RecipeSearchResult {
    message: string;
    search_attempted: string;
    available_recipes?: {
        count: number;
        recipe_names: string[];
        note?: string;
    };
    agent_instruction?: string;
    next_step: string;
    task?: string;
    suggestion?: string;
    alternatives?: string[];
}

export interface RecipeNamesResponse {
    count: number;
    recipe_names: string[];
}

export interface RecipeSearchData {
    recipes?: unknown[];
    pagination?: {
        page: number;
        total_pages: number;
        total: number;
        has_next: boolean;
        has_prev: boolean;
    };
    pagination_info?: string;
    fallback_message?: string;
}

export interface IngredientsResponse {
    count?: number;
    ingredients: string[];
}

export interface DietsResponse {
    count?: number;
    diets: string[];
}

export interface IngredientSearchResult {
    message: string;
    search_ingredient: string;
    search_attempted?: string;
    available_ingredients?: string[];
    agent_instruction?: string;
    note?: string;
    next_step?: string;
    suggestion?: string;
}

export interface DietSearchResult {
    message: string;
    search_diet: string;
    search_attempted?: string;
    available_diets?: string[];
    agent_instruction?: string;
    note?: string;
    next_step?: string;
    suggestion?: string;
    similar_diets?: string[];
}

/**
 * Fetches all available recipe names from the MCP server
 */
export async function fetchAllRecipeNames(
    baseUrl: string,
): Promise<RecipeNamesResponse> {
    const response = await fetch(`${baseUrl}/get_recipe_names`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as RecipeNamesResponse;
}

/**
 * Performs basic text filtering to find relevant recipes
 * Reduces the list before sending to agent for intelligent analysis
 */
export function filterRelevantRecipes(
    searchTerm: string,
    allRecipes: string[],
    maxResults: number = 20,
): string[] {
    const searchTermLower = searchTerm.toLowerCase();

    return allRecipes
        .filter((recipeName: string) => {
            const recipeNameLower = recipeName.toLowerCase();

            // Check for partial matches or common word fragments
            return recipeNameLower.includes(searchTermLower) ||
                searchTermLower.includes(recipeNameLower) ||
                // Check individual words for broader matching
                searchTermLower.split(/\s+/).some((word) =>
                    word.length >= 3 && recipeNameLower.includes(word)
                ) ||
                recipeNameLower.split(/\s+/).some((word) =>
                    word.length >= 3 && searchTermLower.includes(word)
                );
        })
        .slice(0, maxResults);
}

/**
 * Creates a response for when relevant recipes are found and need intelligent analysis
 */
export function createIntelligentMatchingResponse(
    searchTerm: string,
    relevantRecipes: string[],
    totalRecipeCount: number,
): RecipeSearchResult {
    return {
        task: "intelligent_recipe_matching",
        message: `❌ Nenašel jsem přesný recept "${searchTerm}"`,
        search_attempted: searchTerm,
        available_recipes: {
            count: relevantRecipes.length,
            recipe_names: relevantRecipes,
            note:
                `Zobrazuji ${relevantRecipes.length} nejrelevantnějších receptů z celkového počtu ${totalRecipeCount}`,
        },
        agent_instruction:
            `Proanalyzuj tyto recepty a najdi ty, které nejlépe odpovídají hledanému "${searchTerm}". 
            Uvažuj o synonymech, podobných pokrmech a variantách.
            Vrať maximálně 3-5 nejlepších návrhů s krátkým vysvětlením, proč jsou relevantní.`,
        next_step:
            "Agent analyzuje vyfiltrované recepty a navrhne nejlepší shody.",
    };
}

/**
 * Creates a response for when no relevant recipes are found
 */
export function createNoMatchResponse(searchTerm: string): RecipeSearchResult {
    return {
        message: `❓ Nenašel jsem recepty podobné "${searchTerm}"`,
        search_attempted: searchTerm,
        suggestion: "Tento recept není v naší databázi. Zkus:",
        alternatives: [
            "Použít obecnější termíny (např. 'polévka', 'hlavní chod', 'desert')",
            "Hledat podle ingrediencí které používá tento pokrm",
            "Hledat podle typu kuchyně nebo diety",
        ],
        next_step:
            "Nebo řekni mi více o tom, jaký typ jídla hledáš a já ti navrhnu podobné recepty.",
    };
}

/**
 * Creates a fallback response when the fallback mechanism itself fails
 */
export function createFallbackErrorResponse(
    searchTerm: string,
    originalData: RecipeSearchData,
): RecipeSearchData {
    return {
        ...originalData,
        fallback_message:
            `Nenašel jsem recept "${searchTerm}". Zkus použít show_available_names: true pro zobrazení dostupných názvů.`,
    };
}

/**
 * Handles the intelligent recipe matching fallback when no exact matches are found
 */
export async function handleRecipeSearchFallback(
    searchTerm: string,
    baseUrl: string,
    originalData: RecipeSearchData,
): Promise<string> {
    try {
        const namesData = await fetchAllRecipeNames(baseUrl);

        // Basic filtering to reduce the list before sending to agent
        const relevantRecipes = filterRelevantRecipes(
            searchTerm,
            namesData.recipe_names,
        );

        if (relevantRecipes.length > 0) {
            // Found some potentially relevant recipes - let agent analyze them
            const response = createIntelligentMatchingResponse(
                searchTerm,
                relevantRecipes,
                namesData.count,
            );
            return JSON.stringify(response, null, 2);
        } else {
            // No relevant recipes found - suggest alternative approach
            // TODO: use tavily search fallback to look for similar recipes and compare this with the list of existing recipes
            const response = createNoMatchResponse(searchTerm);
            return JSON.stringify(response, null, 2);
        }
    } catch (fallbackError) {
        console.error("Fallback to get_recipe_names failed:", fallbackError);

        // If fallback also fails, return original empty result with guidance
        const errorResponse = createFallbackErrorResponse(
            searchTerm,
            originalData,
        );
        return JSON.stringify(errorResponse, null, 2);
    }
}

/**
 * Adds pagination information to successful recipe search results
 */
export function addPaginationInfo(data: RecipeSearchData): RecipeSearchData {
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
            paginationInfo += `\n⬅️ Pro předchozí recepty použij page: ${
                pagination.page - 1
            }`;
        }

        // Add pagination info to the response
        data.pagination_info = paginationInfo;
    }

    return data;
}

/**
 * Fetches all available ingredients from the MCP server
 */
export async function fetchAllIngredients(
    baseUrl: string,
): Promise<IngredientsResponse> {
    const response = await fetch(`${baseUrl}/get_all_ingredients`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as IngredientsResponse;
}

/**
 * Creates a success response for ingredient search with recipes found
 */
export function createIngredientSearchSuccessResponse(
    searchIngredient: string,
    recipesCount: number,
    data: RecipeSearchData,
): string {
    const dataWithPagination = addPaginationInfo(data);
    return JSON.stringify(
        {
            message:
                `✅ Nalezeno ${recipesCount} receptů s ingrediencí "${searchIngredient}"`,
            search_ingredient: searchIngredient,
            ...dataWithPagination,
        },
        null,
        2,
    );
}

/**
 * Creates a fallback response when no recipes are found with the ingredient
 * Shows available ingredients for agent to find similar ones
 */
export function createIngredientSearchFallbackResponse(
    originalIngredient: string,
    availableIngredients: string[],
    ingredientsCount: number,
): string {
    return JSON.stringify(
        {
            message:
                `❌ Nenašel jsem recepty s ingrediencí "${originalIngredient}"`,
            search_attempted: originalIngredient,
            available_ingredients: availableIngredients,
            agent_instruction:
                `Prohlédni si seznam dostupných ingrediencí a najdi podobnou nebo správnou ingredienci k "${originalIngredient}". Pak použij parametr 'fallback_ingredient' s přesným názvem ze seznamu.`,
            note: `K dispozici je ${ingredientsCount} ingrediencí`,
            next_step:
                "Vyber správnou ingredienci ze seznamu a zkus hledání znovu s parametrem fallback_ingredient.",
        },
        null,
        2,
    );
}

/**
 * Creates a response when no recipes are found even with fallback ingredient
 */
export function createIngredientSearchNoResultsResponse(
    searchIngredient: string,
): string {
    return JSON.stringify(
        {
            message:
                `❌ Nenašel jsem recepty ani s ingrediencí "${searchIngredient}"`,
            search_attempted: searchIngredient,
            suggestion:
                "Zkus použít jinou ingredienci nebo hledat podle více ingrediencí současně.",
        },
        null,
        2,
    );
}

/**
 * Handles ingredient search with intelligent fallback
 * First tries direct search, then shows available ingredients if no results
 */
export async function handleIngredientSearch(
    ingredient: string,
    fallbackIngredient: string | undefined,
    page: number | undefined,
    baseUrl: string,
): Promise<string> {
    try {
        // Use fallback_ingredient if provided, otherwise use the original ingredient
        const searchIngredient = fallbackIngredient || ingredient;

        const params = new URLSearchParams();
        params.append("includes_ingredients", searchIngredient);
        if (page) params.append("page", page.toString());

        const response = await fetch(
            `${baseUrl}/search_recipes?${params.toString()}`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as RecipeSearchData;

        // SUCCESS: Recipes found
        if (data.recipes && data.recipes.length > 0) {
            return createIngredientSearchSuccessResponse(
                searchIngredient,
                data.recipes.length,
                data,
            );
        }

        // FALLBACK: No recipes found - show available ingredients if this was the first attempt
        if (!fallbackIngredient) {
            try {
                const ingredientsData = await fetchAllIngredients(baseUrl);
                const availableIngredients = ingredientsData.ingredients || [];
                const ingredientsCount = ingredientsData.count ||
                    availableIngredients.length || 0;

                return createIngredientSearchFallbackResponse(
                    ingredient,
                    availableIngredients,
                    ingredientsCount,
                );
            } catch (fallbackError) {
                throw new Error(
                    `Error fetching ingredients for fallback: ${
                        fallbackError instanceof Error
                            ? fallbackError.message
                            : "Unknown error"
                    }`,
                );
            }
        }

        // No recipes found even with fallback ingredient
        return createIngredientSearchNoResultsResponse(searchIngredient);
    } catch (error) {
        throw new Error(
            `Error in ingredient search: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
        );
    }
}

/**
 * Fetches all available diets from the MCP server
 */
export async function fetchAllDiets(
    baseUrl: string,
): Promise<DietsResponse> {
    const response = await fetch(`${baseUrl}/get_all_diets`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as DietsResponse;
}

/**
 * Creates a success response for diet search with recipes found
 */
export function createDietSearchSuccessResponse(
    searchDiet: string,
    recipesCount: number,
    data: RecipeSearchData,
): string {
    const dataWithPagination = addPaginationInfo(data);
    return JSON.stringify(
        {
            message:
                `✅ Nalezeno ${recipesCount} receptů pro dietu "${searchDiet}"`,
            search_diet: searchDiet,
            ...dataWithPagination,
        },
        null,
        2,
    );
}

/**
 * Creates a fallback response when no recipes are found with the diet
 * Shows available diets for agent to find similar ones
 */
export function createDietSearchFallbackResponse(
    originalDiet: string,
    availableDiets: string[],
    dietsCount: number,
): string {
    return JSON.stringify(
        {
            message: `❌ Nenašel jsem recepty pro dietu "${originalDiet}"`,
            search_attempted: originalDiet,
            available_diets: availableDiets,
            agent_instruction:
                `Prohlédni si seznam dostupných diet a najdi podobnou nebo správnou dietu k "${originalDiet}". Pak použij parametr 'fallback_diet' s přesným názvem ze seznamu.`,
            note: `K dispozici je ${dietsCount} diet`,
            next_step:
                "Vyber správnou dietu ze seznamu a zkus hledání znovu s parametrem fallback_diet.",
        },
        null,
        2,
    );
}

/**
 * Creates a response when no recipes are found even with fallback diet
 */
export function createDietSearchNoResultsResponse(
    searchDiet: string,
    availableDiets: string[],
): string {
    // Find similar diets by checking for word matches
    const searchTermLower = searchDiet.toLowerCase();
    const similarDiets = availableDiets.filter((diet) =>
        diet.toLowerCase().includes(searchTermLower) ||
        searchTermLower.includes(diet.toLowerCase())
    ).slice(0, 3);

    return JSON.stringify(
        {
            message: `❌ Nenašel jsem recepty ani pro dietu "${searchDiet}"`,
            search_attempted: searchDiet,
            suggestion: "Tato dieta není v naší databázi dostupná.",
            similar_diets: similarDiets.length > 0 ? similarDiets : undefined,
            next_step: similarDiets.length > 0
                ? "Zkus jednu z podobných diet ze seznamu above."
                : "Podívej se na všechny dostupné diety a vyber jinou.",
        },
        null,
        2,
    );
}

/**
 * Handles diet search with intelligent fallback and pagination support
 * First tries direct search, then shows available diets if no results
 */
export async function handleDietSearch(
    diet: string,
    fallbackDiet: string | undefined,
    page: number | undefined,
    baseUrl: string,
): Promise<string> {
    try {
        // Use fallback_diet if provided, otherwise use the original diet
        const searchDiet = fallbackDiet || diet;

        const params = new URLSearchParams();
        params.append("diet", searchDiet);
        if (page) params.append("page", page.toString());

        const response = await fetch(
            `${baseUrl}/search_recipes?${params.toString()}`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json() as RecipeSearchData;

        // SUCCESS: Recipes found
        if (data.recipes && data.recipes.length > 0) {
            return createDietSearchSuccessResponse(
                searchDiet,
                data.recipes.length,
                data,
            );
        }

        // FALLBACK: No recipes found - show available diets if this was the first attempt
        if (!fallbackDiet) {
            try {
                const dietsData = await fetchAllDiets(baseUrl);
                const availableDiets = dietsData.diets || [];
                const dietsCount = dietsData.count || availableDiets.length ||
                    0;

                return createDietSearchFallbackResponse(
                    diet,
                    availableDiets,
                    dietsCount,
                );
            } catch (fallbackError) {
                throw new Error(
                    `Error fetching diets for fallback: ${
                        fallbackError instanceof Error
                            ? fallbackError.message
                            : "Unknown error"
                    }`,
                );
            }
        }

        // No recipes found even with fallback diet - show similar diets
        try {
            const dietsData = await fetchAllDiets(baseUrl);
            const availableDiets = dietsData.diets || [];
            return createDietSearchNoResultsResponse(
                searchDiet,
                availableDiets,
            );
        } catch (_error) {
            return createDietSearchNoResultsResponse(searchDiet, []);
        }
    } catch (error) {
        throw new Error(
            `Error in diet search: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
        );
    }
}
