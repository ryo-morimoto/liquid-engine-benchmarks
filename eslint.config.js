/**
 * ESLint Configuration
 *
 * Uses flat config format (ESLint 9+).
 * Only includes rules that require type information (not available in Biome).
 * Other lint rules are handled by Biome.
 */

import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["node_modules/**", "dist/**", "*.js"],
  },
  {
    files: ["src/**/*.ts", "tests/**/*.ts", "data/**/*.ts", "scripts/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // Async/Await safety rules (require type information)
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/require-await": "warn",
    },
  },
];
