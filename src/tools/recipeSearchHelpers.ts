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
