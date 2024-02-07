import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    types: "src/types.ts",
    index: "src/index.ts",
    "transform-css": "src/transform-css.ts",
    // "inject-styles": "src/inject-styles.ts",
    adapter: "src/adapter.ts",
    // "adapters/ssr-adapter": "src/adapters/ssr-adapter.ts",
    // "adapters/runtime-adapter": "src/adapters/runtime-adapter.ts",
    // "adapters/extract-adapter": "src/adapters/extract-adapter.ts",
    "file-scope": "src/file-scope.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  minify: true,
  // treeshake: true,
  // onSuccess: "tsc --noEmit",
bundle: true,
});
