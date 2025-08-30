// tests/mcpTools.test.ts - Tests for MCP server integration

import {
    assertEquals,
    assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
    beforeEach,
    describe,
    it,
} from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { mcpTools } from "../src/tools/mcpTools.ts";

// Test against the actual running MCP server
const MCP_BASE_URL = Deno.env.get("MCP_BASE_URL") || "http://localhost:8001";

describe("MCP Tools Integration Tests", () => {
    beforeEach(() => {
        // Ensure we're testing against the real server
        Deno.env.set("MCP_BASE_URL", MCP_BASE_URL);
    });

    // Get tool references with explicit type to avoid schema merging issues
    const searchTool = mcpTools[0]; // search_recipes
    const getAllTool = mcpTools[1]; // get_all_recipes
    const addTool = mcpTools[2]; // add_to_shopping_list
    const removeTool = mcpTools[3]; // remove_from_shopping_list
    const getListTool = mcpTools[4]; // get_shopping_list
    const clearTool = mcpTools[5]; // clear_shopping_list

    describe("Recipe Search Tool", () => {
        it("should search recipes by diet", async () => {
            const result =
                await (searchTool.func as unknown as (
                    args: { diet: string },
                ) => Promise<string>)({ diet: "vegetarian" });

            // Should return a JSON string with recipes
            assertStringIncludes(result, "recipes");

            // Parse and verify structure
            const data = JSON.parse(result);
            assertEquals(Array.isArray(data.recipes), true);

            // If recipes are returned, verify they have the vegetarian diet
            if (data.recipes.length > 0) {
                data.recipes.forEach((recipe: { diet: string[] }) => {
                    assertStringIncludes(
                        JSON.stringify(recipe.diet),
                        "vegetarian",
                    );
                });
            }
        });

        it("should search recipes by meal_type", async () => {
            const result =
                await (searchTool.func as unknown as (
                    args: { meal_type: string },
                ) => Promise<string>)({ meal_type: "polévka" });

            assertStringIncludes(result, "recipes");
            const data = JSON.parse(result);
            assertEquals(Array.isArray(data.recipes), true);
        });

        it("should search recipes by name", async () => {
            const result =
                await (searchTool.func as unknown as (
                    args: { name: string },
                ) => Promise<string>)({ name: "těstoviny" });

            assertStringIncludes(result, "recipes");
            const data = JSON.parse(result);
            assertEquals(Array.isArray(data.recipes), true);
        });
    });

    describe("Get All Recipes Tool", () => {
        it("should return all recipes", async () => {
            const result =
                await (getAllTool.func as unknown as (
                    args: Record<PropertyKey, never>,
                ) => Promise<string>)({});

            assertStringIncludes(result, "recipes");
            const data = JSON.parse(result);
            assertEquals(Array.isArray(data.recipes), true);

            // Should have at least some recipes
            assertEquals(data.recipes.length > 0, true);
        });
    });

    describe("Shopping List Tools", () => {
        it("should get shopping list", async () => {
            const result =
                await (getListTool.func as unknown as (
                    args: Record<PropertyKey, never>,
                ) => Promise<string>)({});

            // The real server might return "shopping_list" instead of "items"
            const data = JSON.parse(result);
            // Check for either format the server might return
            const items = data.shopping_list || data.items;
            assertEquals(Array.isArray(items), true);
        });

        it("should add ingredients to shopping list", async () => {
            // First clear the list to start fresh
            await (clearTool.func as unknown as (
                args: Record<PropertyKey, never>,
            ) => Promise<string>)({});

            // Add some ingredients
            const result =
                await (addTool.func as unknown as (
                    args: { ingredients: string[] },
                ) => Promise<string>)({
                    ingredients: ["test rajčata", "test cibule"],
                });

            assertStringIncludes(result, "test rajčata");
            assertStringIncludes(result, "test cibule");
        });

        it("should remove ingredients from shopping list", async () => {
            // First add some ingredients
            await (addTool.func as unknown as (
                args: { ingredients: string[] },
            ) => Promise<string>)({
                ingredients: ["test remove item"],
            });

            // Then remove them
            const result =
                await (removeTool.func as unknown as (
                    args: { ingredients: string[] },
                ) => Promise<string>)({
                    ingredients: ["test remove item"],
                });

            // Verify the result is a valid JSON response
            const parsed = JSON.parse(result);
            assertEquals(typeof parsed, "object");
            assertEquals(Array.isArray(parsed.shopping_list), true);

            // The item should be removed (not in the list)
            assertEquals(
                parsed.shopping_list.includes("test remove item"),
                false,
            );
        });

        it("should clear shopping list", async () => {
            // Add some items first
            await (addTool.func as unknown as (
                args: { ingredients: string[] },
            ) => Promise<string>)({
                ingredients: ["test clear item"],
            });

            // Clear the list
            const result =
                await (clearTool.func as unknown as (
                    args: Record<PropertyKey, never>,
                ) => Promise<string>)({});

            // Verify cleared response
            assertStringIncludes(result, "cleared");
        });
    });

    describe("Server Integration", () => {
        it("should communicate with real MCP server", async () => {
            // Direct test of server endpoints
            const response = await fetch(`${MCP_BASE_URL}/get_shopping_list`);
            assertEquals(response.ok, true);

            const data = await response.json();
            assertEquals(typeof data, "object");
            // The real server returns shopping_list instead of items
            assertEquals(Array.isArray(data.shopping_list), true);
        });

        it("should handle recipe search endpoint", async () => {
            const response = await fetch(
                `${MCP_BASE_URL}/search_recipes?diet=vegetarian`,
            );
            assertEquals(response.ok, true);

            const data = await response.json();
            assertEquals(typeof data, "object");
            assertEquals(Array.isArray(data.recipes), true);
        });
    });
});
