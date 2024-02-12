import { type FileScope } from "@layer-cake/core/types";
import { StaticExtractAdapter } from "@layer-cake/core/adapters/static-adapter";
import { transformCss } from "@layer-cake/core/transform-css";
import evalCode from "eval";
import { stringify } from "javascript-stringify";
import {
  DefaultLayerCakePluginOptions,
  type LayerCakePluginOptions,
} from "./types";
import { debug, formatResourcePath } from "./logger";
import { serializeCss } from "./serialize";

export interface ProcessFileOptions {
  source: string;
  filePath: string;
  serializeVirtualCssPath: ({
    fileName,
    fileScope,
    source,
    virtualCssFilePath,
  }: {
    fileName: string;
    fileScope: FileScope;
    source: string;
    virtualCssFilePath: string;
  }) => string;
}

const originalNodeEnvironment = process.env.NODE_ENV;

export function parseFileScope(serialisedFileScope: string): FileScope {
  const [filePath, packageName] = serialisedFileScope.split("$$$");

  return {
    filePath,
    packageName,
  };
}

export function stringifyExport(value: any) {
  return stringify(value, null, 0, {
    references: true,
    maxDepth: Number.POSITIVE_INFINITY,
    maxValues: Number.POSITIVE_INFINITY,
  });
}

export function processFile(
  { source, filePath, serializeVirtualCssPath }: ProcessFileOptions,
  {
    extract = DefaultLayerCakePluginOptions.extract,
    disableRuntime = DefaultLayerCakePluginOptions.disableRuntime,
  }: LayerCakePluginOptions = {},
) {
  const log = debug(`layer-cake:processFile:${formatResourcePath(filePath)}`);

  const { adapter: staticExtractAdapter, cssByFileScope } =
    StaticExtractAdapter();

  const currentNodeEnvironment = process.env.NODE_ENV;

  process.env.NODE_ENV = originalNodeEnvironment;

  const adapterBoundSource = `require('@layer-cake/core/adapter').setAdapter(__adapter__);${source}`;

  const evalResult = evalCode(
    adapterBoundSource,
    filePath,
    {
      console,
      process,
      __adapter__: staticExtractAdapter,
    },
    true,
  );
  process.env.NODE_ENV = currentNodeEnvironment;

  const cssImports = [];

  for (const [serialisedFileScope, cssObjects] of cssByFileScope) {
    const fileScope = parseFileScope(serialisedFileScope);
    const css = transformCss(cssObjects);
    const fileName = `${fileScope.filePath}.layer-cake.css`;
    const serializedCss = serializeCss(css);
    let virtualCssFilePath = `import '${fileName}?source=${serializedCss}';`;
    if (typeof serializeVirtualCssPath === "function") {
      virtualCssFilePath = serializeVirtualCssPath({
        fileName,
        fileScope,
        source: css,
        virtualCssFilePath,
      });
    }
    cssImports.push(virtualCssFilePath);
  }

  const exports = evalResult as Record<string, unknown>;
  const moduleExports = Object.keys(exports).map((key) =>
    key === "default"
      ? `export default ${stringifyExport(exports[key])}`
      : `export const ${key} = ${stringifyExport(exports[key])}`,
  );

  const outputCode = [...cssImports, ...moduleExports];

  return outputCode.join("\n");
}
