import type { CSSObject, FileScope } from "@layer-cake/core/types";
import type { Adapter } from "@layer-cake/core/adapter";
import { transformCss } from "@layer-cake/core/transform-css";
import { getFileScope } from "@layer-cake/core/file-scope";
import { inspect } from "node:util";
import evalCode from "eval";
import { DefaultLayerCakeOptions, LayerCakeOptions, serializeCss } from ".";
import { debug, formatResourcePath } from "./logger";
import { stringify } from "javascript-stringify";

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

function dbg(message: string, object: any = null, depth: number = 2) {
  if (!object && typeof message === "string") {
    console.log(message);
    return;
  }
  if (!object) {
    console.log(inspect(message, { depth, colors: true }));
    return;
  }
  console.log(message, inspect(object, { depth, colors: true }));
}

const originalNodeEnvironment = process.env.NODE_ENV;

export function stringifyFileScope({
  packageName,
  filePath,
}: FileScope): string {
  return packageName ? `${filePath}$$$${packageName}` : filePath;
}

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
    extract = DefaultLayerCakeOptions.extract,
    disableRuntime = DefaultLayerCakeOptions.disableRuntime,
  }: LayerCakeOptions = {},
) {
  const log = debug(`layer-cake:processFile:${formatResourcePath(filePath)}`);

  const cssByFileScope = new Map<string, Array<CSSObject>>();
  const localClassNames = new Set<string>();

  const staticExtractAdapter: Adapter = {
    appendCss(css: CSSObject) {
      const serialisedFileScope = stringifyFileScope(getFileScope());
      const fileScopeCss = cssByFileScope.get(serialisedFileScope) ?? [];

      fileScopeCss.push(css);

      cssByFileScope.set(serialisedFileScope, fileScopeCss);
    },
    registerClassName(className: string) {
      localClassNames.add(className);
    },
    applyCss() {
      // stringifiedCss = transformCss([...bufferedCSSObjects]);
    },
  };

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
