import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "layer-cake-webpack-plugin": "src/index.ts",
    "layer-cake-webpack-plugin-loader": "src/loader.ts",
    "layer-cake-webpack-plugin-virtualFileLoader": "src/virtualFileLoader.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs.js" : ".esm.js",
    };
  },
  bundle: true,
  external: ["@layer-cake/integration"],
});
