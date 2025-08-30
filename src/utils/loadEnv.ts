// loadEnv.ts - Utility to load environment variables from .env file

export async function loadEnv() {
    try {
        // Try to read .env file from the current working directory
        const envText = await Deno.readTextFile(".env");

        // Parse the .env file
        for (const line of envText.split("\n")) {
            const trimmedLine = line.trim();

            // Skip empty lines and comments
            if (!trimmedLine || trimmedLine.startsWith("#")) {
                continue;
            }

            // Parse key=value pairs
            const equalIndex = trimmedLine.indexOf("=");
            if (equalIndex > 0) {
                const key = trimmedLine.slice(0, equalIndex).trim();
                const value = trimmedLine.slice(equalIndex + 1).trim();

                // Only set if not already set (system env vars take precedence)
                if (!Deno.env.get(key)) {
                    Deno.env.set(key, value);
                }
            }
        }

        console.log("✅ Loaded environment variables from .env file");
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            console.log(
                "ℹ️  No .env file found, using system environment variables",
            );
        } else {
            console.warn(
                "⚠️  Error loading .env file:",
                error instanceof Error ? error.message : String(error),
            );
        }
    }
}
