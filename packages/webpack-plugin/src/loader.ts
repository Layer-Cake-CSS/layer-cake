import path from "path";

import loaderUtils from "loader-utils";

import { debug, formatResourcePath } from "@layer-cake/integration/logger";
import type { ChildCompiler } from "./compiler";
import { processFile, LayerCakeOptions } from "@layer-cake/integration";
import type { LoaderContext } from "webpack";

const virtualLoader = require.resolve(
  path.join(
    path.dirname(require.resolve("../package.json")),
    "virtualFileLoader"
  )
);

const emptyCssExtractionFile = path.join(
  path.dirname(require.resolve("../package.json")),
  "extracted.js"
);

interface LoaderOptions {
  layerCakeOptions: LayerCakeOptions;
  shouldProcessFile?: (filePath: string) => boolean | void;
}

interface InternalLoaderOptions extends LoaderOptions {
  childCompiler: ChildCompiler;
}

// export default function LayerCakeLoader(this: LoaderContext, source: string) {
// }

export function pitch(this: LoaderContext<InternalLoaderOptions>) {
  const { childCompiler, layerCakeOptions, shouldProcessFile } =
    this.getOptions();

  const filePath = this.resourcePath;

  let shouldProcess = !(
    filePath.includes("/node_modules/") || filePath.includes("/packages/")
  );
  if (typeof shouldProcessFile === "function") {
    const shouldProcessFileResult = shouldProcessFile(filePath);
    if (typeof shouldProcessFileResult === "boolean") {
      shouldProcess = shouldProcessFileResult;
    }
  }
  if (!shouldProcess) {
    return;
  }

  const log = debug(
    `layer-cake:loader:${formatResourcePath(this.resourcePath)}`
  );

  const compiler = this._compiler;

  if (!compiler) {
    throw new Error("No compiler found");
  }

  const isChildCompiler = childCompiler.isChildCompiler(compiler.name);

  if (isChildCompiler) {
    log(
      "Skip layer-cake loader as we are already within a child compiler for %s",
      compiler.options.output.filename
    );
    return;
  }

  log("Loading file");

  const callback = this.async();

  childCompiler
    .getCompiledSource(this)
    .then(async ({ source }) => {
      const result = await processFile({
        source,
        filePath,
        serializeVirtualCssPath: ({ fileName, serializedCss }) => {
          const virtualResourceLoader = `${virtualLoader}?${JSON.stringify({
            fileName,
            source: serializedCss,
          })}`;

          const request = loaderUtils.stringifyRequest(
            this,
            `${fileName}!=!${virtualResourceLoader}!${emptyCssExtractionFile}`
          );

          return `import ${request}`;
        },
      });

      log("Completed successfully");

      callback(null, result);
    })
    .catch((e) => {
      callback(e);
    });
}
