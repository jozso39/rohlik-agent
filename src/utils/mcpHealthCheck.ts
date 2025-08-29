// mcpHealthCheck.ts - Utility to check if MCP server is running

/**
 * Simple MCP server health check
 * Calls the /get_shopping_list endpoint to verify server is accessible
 * Exits the process with error message if server is not available
 */
export async function checkMCPServer(): Promise<void> {
    const MCP_BASE_URL = Deno.env.get("MCP_BASE_URL") ||
        "http://localhost:8001";
    try {
        const response = await fetch(`${MCP_BASE_URL}/get_shopping_list`);
        if (!response.ok) {
            throw new Error(
                `MCP server responded with status: ${response.status}`,
            );
        }
    } catch (error) {
        console.error("❌ MCP server není dostupný!");
        console.error(`   Ujistěte se, že MCP server běží na ${MCP_BASE_URL}`);
        console.error(
            `   Chyba: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
        );
        Deno.exit(1);
    }
}
