import { BuildOptions, build as esbuild, Plugin } from "esbuild";
import { join, dirname } from "node:path";
import { promises as fs } from "node:fs";
import { cssFileFilter } from "./filters";
import { transform } from "./transform";
import { getPackageInfo } from "./package-info";

export function layerCakeTransformPlugin(): Plugin {
  return {
    name: "layer-cake-transform",
    setup(build) {
      const packageInfo = getPackageInfo(build.initialOptions.absWorkingDir);

      build.onLoad({ filter: cssFileFilter }, async ({ path }) => {
        const originalSource = await fs.readFile(path, "utf8");

        const source = await transform({
          source: originalSource,
          filePath: path,
          rootPath: build.initialOptions.absWorkingDir!,
          packageName: packageInfo.name,
        });

        return {
          contents: source,
          loader: /\.(ts|tsx)$/i.test(path) ? "ts" : undefined,
          resolveDir: dirname(path),
        };
      });
    },
  };
}

export interface CompileOptions {
  filePath: string;
  cwd?: string;
  esbuildOptions?: Pick<
    BuildOptions,
    "plugins" | "external" | "define" | "loader" | "tsconfig"
  >;
}
export async function compile({
  filePath,
  cwd = process.cwd(),
  esbuildOptions,
}: CompileOptions) {
  const result = await esbuild({
    entryPoints: [filePath],
    metafile: true,
    bundle: true,
    external: ["@layer-cake", ...(esbuildOptions?.external ?? [])],
    platform: "node",
    write: false,
    plugins: [layerCakeTransformPlugin(), ...(esbuildOptions?.plugins ?? [])],
    absWorkingDir: cwd,
    loader: esbuildOptions?.loader,
    define: esbuildOptions?.define,
    tsconfig: esbuildOptions?.tsconfig,
  });

  const { outputFiles, metafile } = result;

  if (!outputFiles || outputFiles.length !== 1) {
    throw new Error("Invalid child compliation result");
  }

  return {
    source: outputFiles[0].text,
    watchFiles: Object.keys(metafile?.inputs || {}).map((watchFilePath) =>
      join(cwd, watchFilePath),
    ),
  };
}
