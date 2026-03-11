import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/tools/index.ts",
    "src/resources/index.ts",
    "src/prompts/index.ts",
    "src/context/mcp-context.ts",
  ],
  outDir: "bin",
  format: "esm",
  platform: "node",
  target: "node24",
  clean: true,
  dts: true,
  tsconfig: "tsconfig.build.json",
  minify: true,
  fixedExtension: false,
});
