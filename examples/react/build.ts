import * as esbuild from "esbuild";
import { LayerCakePlugin } from "@layer-cake/esbuild-plugin";
import { htmlPlugin } from "@craftamap/esbuild-plugin-html";
import fs from "fs/promises";

async function main() {
  const indexHtmlTemplate = await fs.readFile("./index.html", "utf-8");

  esbuild.build({
    entryPoints: ["src/index.tsx"],
    bundle: true,
    metafile: true, //
    // outfile: "dist/index.js",
    outdir: "dist",
    plugins: [
      htmlPlugin({
        files: [
          {
            entryPoints: ["src/index.tsx"],
            filename: "index.html",
            htmlTemplate: indexHtmlTemplate,
          },
        ],
      }),
      LayerCakePlugin({
        esbuildOptions: {
          plugins: [],
        },
      }),
    ],
  });
}

main();
