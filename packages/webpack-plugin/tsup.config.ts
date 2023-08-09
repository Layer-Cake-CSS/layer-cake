import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    "layer-cake-webpack-plugin": "src/index.ts",
    "layer-cake-webpack-plugin-loader": "src/loader.ts",
    "layer-cake-webpack-plugin-css-loader": "src/css-loader.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".cjs.js" : ".esm.js",
    };
  },
  bundle: false,
});
