// mcpHealthCheck.ts - Utility to check if MCP server is running

/**
 * Simple MCP server health check
 * Calls the /get_shopping_list endpoint to verify server is accessible
 * Exits the process with error message if server is not available
 */
export async function checkMCPServer(mcpBaseUrl: string): Promise<void> {
    try {
        const response = await fetch(`${mcpBaseUrl}/get_shopping_list`);
        if (!response.ok) {
            throw new Error(
                `MCP server responded with status: ${response.status}`,
            );
        }
    } catch (error) {
        console.error("❌ MCP server není dostupný!");
        console.error(`   Ujistěte se, že MCP server běží na ${mcpBaseUrl}`);
        console.error(
            `   Chyba: ${
                error instanceof Error ? error.message : "Unknown error"
            }`,
        );
        Deno.exit(1);
    }
}
