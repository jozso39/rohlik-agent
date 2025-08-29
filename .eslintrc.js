module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
        sourceType: "module",
    },
    plugins: ["@typescript-eslint"],
    extends: [
        "eslint:recommended",
        "@typescript-eslint/recommended",
        "@typescript-eslint/recommended-requiring-type-checking",
        "prettier", // This should be last to override other configs
    ],
    root: true,
    env: {
        node: true,
        es6: true,
    },
    ignorePatterns: [
        ".eslintrc.js",
        "dist/**/*",
        "node_modules/**/*",
        "docs/**/*",
        "plans/**/*",
    ],
    rules: {
        // TypeScript specific rules
        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
        }],
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/no-misused-promises": "error",

        // General JavaScript/TypeScript rules
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
        "eqeqeq": ["error", "always"],

        // Code style (basic ones, prettier handles formatting)
        "prefer-arrow-callback": "error",
        "arrow-spacing": "error",
    },
    overrides: [
        {
            files: ["*.js"],
            rules: {
                "@typescript-eslint/no-var-requires": "off",
                "@typescript-eslint/no-require-imports": "off",
            },
        },
    ],
};
