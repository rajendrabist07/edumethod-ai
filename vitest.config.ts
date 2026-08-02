import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.next/**"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/node_modules/**",
        "**/e2e/**",
        "app/api/**",
        "scripts/**",
        "**/*.test.ts",
        "**/*.spec.ts"
      ],
      thresholds: {
        statements: 85,
        branches: 65,
        functions: 90,
        lines: 84,
      },
    },
  },
});
