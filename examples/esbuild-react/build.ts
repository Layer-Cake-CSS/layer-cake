import * as esbuild from "esbuild";
import { LayerCakePlugin } from "@layer-cake/esbuild-plugin";

const TestPlugin = {
  name: "test",
  setup(build) {
    build.onLoad({ filter: /\.(js|mjs|cjs|ts|tsx|jsx)$/ }, async (args) => {
      const { path } = args;
      // TODO need a robust way to only include project files
      if (path.includes("/node_modules/") || path.includes("/packages/")) {
        return;
      }
      console.log("TEST PLUGIN onLoad", args);
    });
  },
};

esbuild.build({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  outfile: "dist/index.js",
  plugins: [
    LayerCakePlugin(),
    // TestPlugin
  ],
});
