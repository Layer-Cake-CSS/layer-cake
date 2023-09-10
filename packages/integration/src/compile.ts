import { BuildOptions, build as esbuild } from "esbuild";
import { join } from "path";

export interface CompileOptions {
  filePath: string;
  cwd?: string;
  esbuildOptions?: Pick<
    BuildOptions,
    "plugins" | "external" | "define" | "loader"
  >;
}
export async function compile({
  filePath,
  cwd = process.cwd(),
  esbuildOptions,
}: CompileOptions) {
  const result = await esbuild({
    preserveSymlinks: true,
    entryPoints: [filePath],
    metafile: true,
    // bundle: true,
    // external: ["@layer-cake", ...(esbuildOptions?.external ?? [])],
    platform: "node",
    write: false,
    // TODO test if ESM is ok for all cases?
    // Or maybe the compile step can be after the process step for non-webpack bundlers...?
    format: "esm",
    plugins: [...(esbuildOptions?.plugins ?? [])],
    absWorkingDir: cwd,
    loader: esbuildOptions?.loader,
    define: esbuildOptions?.define,
  });

  const { outputFiles, metafile } = result;

  if (!outputFiles || outputFiles.length !== 1) {
    throw new Error("Invalid child compliation result");
  }

  return {
    source: outputFiles[0].text,
    watchFiles: Object.keys(metafile?.inputs || {}).map((filePath) =>
      join(cwd, filePath)
    ),
  };
}
