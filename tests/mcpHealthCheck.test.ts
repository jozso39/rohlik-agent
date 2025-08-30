// tests/mcpHealthCheck.test.ts - Tests for MCP health check utility

import {
    assertEquals,
    assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { describe, it } from "https://deno.land/std@0.224.0/testing/bdd.ts";
import { checkMCPServer } from "../src/utils/mcpHealthCheck.ts";

describe("MCP Health Check Tests", () => {
    describe("Server availability", () => {
        it("should pass when real MCP server is running", async () => {
            const MCP_BASE_URL = Deno.env.get("MCP_BASE_URL") ||
                "http://localhost:8001";
            // Test against the actual running server
            // This should not throw an error if server is up
            await checkMCPServer(MCP_BASE_URL);
        });

        it("should verify server responds to health check endpoint", async () => {
            const MCP_BASE_URL = Deno.env.get("MCP_BASE_URL") ||
                "http://localhost:8001";
            // Direct test of the health check endpoint
            const response = await fetch(`${MCP_BASE_URL}/get_shopping_list`);
            assertEquals(response.ok, true);

            const data = await response.json();
            assertEquals(typeof data, "object");
            assertEquals(Array.isArray(data.shopping_list), true);
            // Note: response.json() automatically consumes the body
        });
    });

    describe("Error handling with unavailable server", () => {
        it("should exit when server is not available", async () => {
            // Test with a definitely unavailable port
            const MCP_BASE_URL = "http://localhost:9999";
            // Mock Deno.exit
            let exitCalled = false;
            const originalExit = Deno.exit;
            Deno.exit = (code?: number) => {
                exitCalled = true;
                throw new Error(`Process would exit with code: ${code}`);
            };

            try {
                await assertRejects(
                    () => checkMCPServer(MCP_BASE_URL),
                    Error,
                    "Process would exit with code: 1",
                );
                assertEquals(exitCalled, true);
            } finally {
                // Restore original Deno.exit and environment
                Deno.exit = originalExit;
            }
        });
    });
});
