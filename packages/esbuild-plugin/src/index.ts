import type { Plugin } from "esbuild";
import {
  virtualCssFileFilter,
  compile,
  CompileOptions,
  processFile,
  getSourceFromVirtualCssFile,
  LayerCakeOptions,
  layerCakeFileFilter,
} from "@layer-cake/integration";
import { dirname, join } from "path";

export interface PluginOptions extends LayerCakeOptions {
  fileFilter?: RegExp;
  esbuildOptions?: CompileOptions["esbuildOptions"];
  shouldProcessFile?: (filePath: string) => boolean | void;
}

const layerCakeCssNamespace = "layer-cake-css-ns";

export function LayerCakePlugin({
  esbuildOptions,
  fileFilter = layerCakeFileFilter,
  shouldProcessFile,
  ...layerCakeOptions
}: PluginOptions = {}): Plugin {
  return {
    name: "layer-cake",
    setup(build) {
      build.onResolve({ filter: virtualCssFileFilter }, (args) => {
        return {
          path: args.path,
          namespace: layerCakeCssNamespace,
        };
      });

      build.onLoad(
        { filter: /.*/, namespace: layerCakeCssNamespace },
        async ({ path }) => {
          let { source, fileName } = await getSourceFromVirtualCssFile(path);

          // TODO allow for post processing of css?

          const rootDir = build.initialOptions.absWorkingDir ?? process.cwd();

          const resolveDir = dirname(join(rootDir, fileName));

          return {
            contents: source,
            loader: "css",
            resolveDir,
          };
        }
      );

      build.onLoad({ filter: fileFilter }, async (args) => {
        const { path } = args;
        // TODO need a robust way to only include project files
        let shouldProcess = !(
          path.includes("/node_modules/") || path.includes("/packages/")
        );
        if (typeof shouldProcessFile === "function") {
          const shouldProcessFileResult = shouldProcessFile(path);
          if (typeof shouldProcessFileResult === "boolean") {
            shouldProcess = shouldProcessFileResult;
          }
        }
        if (!shouldProcess) {
          return;
        }

        const combinedEsbuildOptions = {
          ...{
            plugins:
              build.initialOptions.plugins?.filter(
                (plugin) => plugin.name !== "layer-cake"
              ) ?? [],
            external: build.initialOptions.external ?? [],
          },
          ...({ ...esbuildOptions } ?? {}),
        };

        const { source, watchFiles } = await compile({
          filePath: path,
          cwd: build.initialOptions.absWorkingDir,
          esbuildOptions: combinedEsbuildOptions,
        });

        const contents = await processFile(
          {
            source,
            filePath: path,
          },
          layerCakeOptions
        );

        return {
          contents,
          loader: "js",
          watchFiles,
        };
      });
    },
  };
}
