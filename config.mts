// config.mts - Environment configuration and validation

import "dotenv/config";

// Validate required environment variables
function validateEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

// Export validated environment variables
export const config = {
    openai: {
        apiKey: validateEnvVar("OPENAI_API_KEY"),
    },
    tavily: {
        apiKey: validateEnvVar("TAVILY_API_KEY"),
    },
    mcp: {
        baseUrl: process.env.MCP_BASE_URL || "http://localhost:8001",
    },
};

// Log configuration (without sensitive data)
console.log("🔧 Configuration loaded:");
console.log(`   - MCP Base URL: ${config.mcp.baseUrl}`);
console.log(
    `   - OpenAI API Key: ${config.openai.apiKey ? "✅ Set" : "❌ Missing"}`,
);
console.log(
    `   - Tavily API Key: ${config.tavily.apiKey ? "✅ Set" : "❌ Missing"}`,
);
