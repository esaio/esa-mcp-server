import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["**/__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "bin/",
        "**/*.config.ts",
        "**/*.config.js",
        "**/context/**",
        "**/generated/**",
      ],
    },
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
});
