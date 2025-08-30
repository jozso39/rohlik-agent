// tests/mealPlan.test.ts - Tests for meal plan creation functionality

import {
    assertEquals,
    assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
    afterEach,
    beforeEach,
    describe,
    it,
} from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { mcpTools } from "../src/tools/mcpTools.ts";

// Test against the actual running MCP server
const MCP_BASE_URL = Deno.env.get("MCP_BASE_URL") || "http://localhost:8001";

// Type for meal plan arguments
type MealPlanArgs = {
    title: string;
    days: {
        day_name: string;
        meals: {
            meal_type: "snídaně" | "oběd" | "večeře" | "svačina";
            recipe_name: string;
        }[];
    }[];
};

describe("Meal Plan Creation Tests", () => {
    const testPlanDir = "./test_plans";

    beforeEach(async () => {
        // Use the real MCP server
        Deno.env.set("MCP_BASE_URL", MCP_BASE_URL);

        // Create test directory
        try {
            await Deno.mkdir(testPlanDir, { recursive: true });
        } catch {
            // Directory might already exist
        }
    });

    afterEach(async () => {
        // Clean up test files
        try {
            for await (const entry of Deno.readDir(testPlanDir)) {
                if (entry.name.startsWith("jidelnicek_")) {
                    await Deno.remove(`${testPlanDir}/${entry.name}`);
                }
            }
            await Deno.remove(testPlanDir);
        } catch {
            // Directory might not exist or be empty
        }
    });

    function findMealPlanTool() {
        return mcpTools.find((tool) => tool.name === "create_meal_plan");
    }

    describe("Meal Plan Tool", () => {
        it("should create a simple meal plan", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Test Vegetariánský Plán",
                days: [
                    {
                        day_name: "Den 1 - Pondělí",
                        meals: [
                            {
                                meal_type: "oběd" as const,
                                recipe_name: "Palačinky", // Use a recipe that likely exists
                            },
                        ],
                    },
                ],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Verify the meal plan was processed
            assertStringIncludes(result, "Test Vegetariánský Plán");
            assertStringIncludes(result, "Den 1 - Pondělí");
            assertStringIncludes(result, "Palačinky");
        });

        it("should create a multi-day meal plan", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Týdenní Vegetariánský Plán",
                days: [
                    {
                        day_name: "Den 1 - Pondělí",
                        meals: [
                            {
                                meal_type: "snídaně" as const,
                                recipe_name: "Palačinky",
                            },
                            {
                                meal_type: "oběd" as const,
                                recipe_name: "Krupicová kaše",
                            },
                        ],
                    },
                    {
                        day_name: "Den 2 - Úterý",
                        meals: [
                            {
                                meal_type: "večeře" as const,
                                recipe_name: "Okurkový salát",
                            },
                        ],
                    },
                ],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Verify multi-day structure
            assertStringIncludes(result, "Týdenní Vegetariánský Plán");
            assertStringIncludes(result, "Den 1 - Pondělí");
            assertStringIncludes(result, "Den 2 - Úterý");
            assertStringIncludes(result, "Palačinky");
            assertStringIncludes(result, "Okurkový salát");
        });

        it("should create meal plan with various meal types", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Rozmanité Jídlo",
                days: [
                    {
                        day_name: "Test Den",
                        meals: [
                            {
                                meal_type: "snídaně" as const,
                                recipe_name: "Palačinky",
                            },
                            {
                                meal_type: "svačina" as const,
                                recipe_name: "Hummus",
                            },
                        ],
                    },
                ],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Verify different meal types are handled
            assertStringIncludes(result, "Rozmanité Jídlo");
            assertStringIncludes(result, "Snídaně");
            assertStringIncludes(result, "Svačina");
        });

        it("should handle meal plan with non-existent recipes", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Plán s Neexistujícími Recepty",
                days: [
                    {
                        day_name: "Test Den",
                        meals: [
                            {
                                meal_type: "oběd" as const,
                                recipe_name: "Úplně Neexistující Recept",
                            },
                        ],
                    },
                ],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Should still process the meal plan even if recipe doesn't exist
            assertStringIncludes(result, "Plán s Neexistujícími Recepty");
            assertStringIncludes(result, "Úplně Neexistující Recept");
        });

        it("should handle empty meal plan", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Prázdný Plán",
                days: [],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Should handle empty days gracefully
            assertStringIncludes(result, "Prázdný Plán");
        });
    });

    describe("Server Integration", () => {
        it("should fetch real recipes from server", async () => {
            // Test that we can actually fetch recipes from the real server
            const response = await fetch(
                `${MCP_BASE_URL}/search_recipes?name=Palačinky`,
            );
            assertEquals(response.ok, true);

            const data = await response.json();
            assertEquals(typeof data, "object");
            assertEquals(Array.isArray(data.recipes), true);
        });

        it("should handle all recipes endpoint", async () => {
            const response = await fetch(`${MCP_BASE_URL}/get_recipes`);
            assertEquals(response.ok, true);

            const data = await response.json();
            assertEquals(typeof data, "object");
            assertEquals(Array.isArray(data.recipes), true);

            // Should have at least some recipes
            assertEquals(data.recipes.length > 0, true);
        });
    });
});

describe("Meal Plan Creation Tests", () => {
    const testPlanDir = "./test_plans";

    beforeEach(async () => {
        Deno.env.set("MCP_BASE_URL", MCP_BASE_URL);

        // Create test directory
        try {
            await Deno.mkdir(testPlanDir, { recursive: true });
        } catch {
            // Directory might already exist
        }
    });

    afterEach(async () => {
        // Clean up test files
        try {
            for await (const entry of Deno.readDir(testPlanDir)) {
                if (entry.name.startsWith("jidelnicek_")) {
                    await Deno.remove(`${testPlanDir}/${entry.name}`);
                }
            }
            await Deno.remove(testPlanDir);
        } catch {
            // Directory might not exist or be empty
        }
    });

    function findMealPlanTool() {
        return mcpTools.find((tool) => tool.name === "create_meal_plan");
    }

    describe("Meal Plan Tool", () => {
        it("should create a simple meal plan", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Test Vegetariánský Plán",
                days: [
                    {
                        day_name: "Den 1 - Pondělí",
                        meals: [
                            {
                                meal_type: "oběd" as const,
                                recipe_name: "Vegetariánské těstoviny",
                            },
                        ],
                    },
                ],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Check console output format
            assertStringIncludes(
                result,
                "📅 JÍDELNÍČEK: Test Vegetariánský Plán",
            );
            assertStringIncludes(result, "🗓️ Den 1 - Pondělí:");
            assertStringIncludes(result, "• Oběd: Vegetariánské těstoviny");
        });

        it("should create meal plan with multiple days and meals", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Týdenní Plán",
                days: [
                    {
                        day_name: "Den 1 - Pondělí",
                        meals: [
                            {
                                meal_type: "snídaně" as const,
                                recipe_name: "Vegetariánské těstoviny",
                            },
                            {
                                meal_type: "oběd" as const,
                                recipe_name: "Vegetariánské těstoviny",
                            },
                        ],
                    },
                    {
                        day_name: "Den 2 - Úterý",
                        meals: [
                            {
                                meal_type: "večeře" as const,
                                recipe_name: "Vegetariánské těstoviny",
                            },
                        ],
                    },
                ],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Check multiple days are included
            assertStringIncludes(result, "Den 1 - Pondělí");
            assertStringIncludes(result, "Den 2 - Úterý");
            assertStringIncludes(result, "• Snídaně:");
            assertStringIncludes(result, "• Oběd:");
            assertStringIncludes(result, "• Večeře:");
        });

        it("should handle meal types correctly", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Test Meal Types",
                days: [
                    {
                        day_name: "Test Day",
                        meals: [
                            {
                                meal_type: "snídaně" as const,
                                recipe_name: "Vegetariánské těstoviny",
                            },
                            {
                                meal_type: "svačina" as const,
                                recipe_name: "Vegetariánské těstoviny",
                            },
                        ],
                    },
                ],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Check meal types are properly capitalized and ordered
            assertStringIncludes(result, "• Snídaně:");
            assertStringIncludes(result, "• Svačina:");
        });

        it("should handle recipes not found in MCP server", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Test Unknown Recipe",
                days: [
                    {
                        day_name: "Test Day",
                        meals: [
                            {
                                meal_type: "oběd" as const,
                                recipe_name: "Neexistující Recept",
                            },
                        ],
                    },
                ],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Should still create plan even with unknown recipe
            assertStringIncludes(result, "📅 JÍDELNÍČEK: Test Unknown Recipe");
            assertStringIncludes(result, "• Oběd: Neexistující Recept");
        });

        it("should generate proper console output format", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Format Test",
                days: [
                    {
                        day_name: "Den 1",
                        meals: [
                            {
                                meal_type: "oběd" as const,
                                recipe_name: "Vegetariánské těstoviny",
                            },
                        ],
                    },
                ],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Check the specific format requirements
            const lines = result.split("\n");
            const titleLine = lines.find((line) =>
                line.includes("📅 JÍDELNÍČEK:")
            );
            const dayLine = lines.find((line) => line.includes("🗓️ Den 1:"));
            const mealLine = lines.find((line) => line.includes("• Oběd:"));

            assertEquals(!!titleLine, true);
            assertEquals(!!dayLine, true);
            assertEquals(!!mealLine, true);
        });

        it("should handle empty meal plan gracefully", async () => {
            const mealPlanTool = findMealPlanTool();
            if (!mealPlanTool) throw new Error("Meal plan tool not found");

            const mealPlan = {
                title: "Empty Plan",
                days: [],
            };

            const result = await (mealPlanTool.func as unknown as (args: MealPlanArgs) => Promise<string>)(mealPlan);

            // Should still have title
            assertStringIncludes(result, "📅 JÍDELNÍČEK: Empty Plan");
        });
    });
});
