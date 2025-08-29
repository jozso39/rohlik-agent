const js = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const prettier = require("eslint-config-prettier");

module.exports = [
    // Base JavaScript recommended rules
    js.configs.recommended,

    // Apply only to TypeScript files
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsparser,
            parserOptions: {
                sourceType: "module",
            },
            globals: {
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                module: "readonly",
                require: "readonly",
                exports: "readonly",
                global: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearTimeout: "readonly",
                clearInterval: "readonly",
                fetch: "readonly",
                URLSearchParams: "readonly",
                URL: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint,
        },
        rules: {
            // TypeScript specific rules (without type-checking for speed)
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-explicit-any": "warn",

            // General rules
            "no-console": "off", // Allow console.log for CLI apps
            "prefer-const": "error",
            "no-var": "error",
            "object-shorthand": "error",
            "prefer-template": "error",

            // Import/module rules
            "no-duplicate-imports": "error",

            // Error prevention
            "no-unreachable": "error",
            "no-unused-expressions": "error",
            eqeqeq: ["error", "always"],

            // Code style
            "prefer-arrow-callback": "error",
        },
    },

    // Prettier config (should be last)
    prettier,

    // Ignore patterns
    {
        ignores: [
            "dist/**/*",
            "node_modules/**/*",
            "docs/**/*",
            "plans/**/*",
            "*.tsbuildinfo",
            ".env*",
            "**/*.js", // Ignore all JS files since we only work with TypeScript
        ],
    },
];
