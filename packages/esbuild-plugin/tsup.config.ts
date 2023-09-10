import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "layer-cake-esbuild-plugin": "src/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["esbuild"],
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs.js" : ".esm.js",
    };
  },
});
