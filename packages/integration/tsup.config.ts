import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    logger: "src/logger.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  sourcemap: true,
  treeshake: true,
  clean: true,
  external: ["esbuild", "@layer-cake/core"],
});
