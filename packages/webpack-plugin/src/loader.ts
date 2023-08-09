import fs from "fs";
import type { LoaderContext, ResolveOptions } from "webpack";
import { parseAsync, PluginItem, transformFromAstAsync } from "@babel/core";
import { CachedInputFileSystem, ResolverFactory } from "enhanced-resolve";
import { dirname, normalize } from "path";

interface LoaderOptions {
  bake?: boolean;
  extract?: boolean;
  resolve?: ResolveOptions;
}

// let hasErrored = false;

function getLoaderOptions(context: LoaderContext<LoaderOptions>) {
  const {
    bake = true,
    extract = false,
    resolve = {},
  }: LoaderOptions = context.getOptions({
    type: "object",
    properties: {
      bake: {
        type: "boolean",
      },
      extract: {
        type: "boolean",
      },
      resolve: {
        type: "object",
      },
    },
  });

  return {
    bake,
    extract,
    resolve,
  };
}

export default async function layerCakeLoader(
  this: LoaderContext<LoaderOptions>,
  code: string
): Promise<void> {
  const callback = this.async();

  // Bail early if Layer-Cake isn't in the module or we're looking at runtime code
  if (
    code.indexOf("@layer-cake/core") === -1 ||
    this.resourcePath.includes("/node_modules/@layer-cake/core")
  ) {
    console.log("SKIP NO LAYER-CAKE", this.resourcePath);
    return callback(null, code);
  }

  try {
    const includedFiles: string[] = [];
    const { resolve, ...options } = getLoaderOptions(this);

    // Transform to an AST using the local babel config.
    const ast = await parseAsync(code, {
      filename: this.resourcePath,
      caller: { name: "layer-cake" },
      rootMode: "upward-optional",
      parserOpts: {
        // plugins: options.parserBabelPlugins ?? undefined,
      },
      // plugins: options.transformerBabelPlugins ?? undefined,
    });

    // Setup the default resolver, where webpack will merge any passed in options with the default
    // resolve configuration. Ideally, we use this.getResolve({ ...resolve, useSyncFileSystemCalls: true, })
    // However, it does not work correctly when in development mode :/
    const resolver = ResolverFactory.createResolver({
      // @ts-expect-error
      fileSystem: new CachedInputFileSystem(fs, 4000),
      ...(this._compilation?.options.resolve ?? {}),
      ...resolve,
      // This makes the resolver invoke the callback synchronously
      useSyncFileSystemCalls: true,
    });

    // Transform using the Compiled Babel Plugin - we deliberately turn off using the local config.
    const result = await transformFromAstAsync(ast!, code, {
      babelrc: false,
      configFile: false,
      sourceMaps: true,
      filename: this.resourcePath,
      parserOpts: {
        // plugins: options.parserBabelPlugins ?? undefined,
      },
      plugins: [
        // ...(options.transformerBabelPlugins ?? []),
        // options.extract && [
        //   "@compiled/babel-plugin-strip-runtime",
        //   {
        //     styleSheetPath: `@compiled/webpack-loader/css-loader!@compiled/webpack-loader/css-loader/${styleSheetName}.css`,
        //     compiledRequireExclude: options.ssr,
        //   },
        // ],
        options.bake && [
          "@layer-cake/babel-plugin",
          {
            ...options,
            // Turn off compressing class names if stylesheet extraction is off
            // classNameCompressionMap:
            //   options.extract && options.classNameCompressionMap,
            onIncludedFiles: (files: string[]) => includedFiles.push(...files),
            resolver: {
              // The resolver needs to be synchronous, as babel plugins must be synchronous
              resolveSync: (context: string, request: string) => {
                return resolver.resolveSync({}, dirname(context), request);
              },
            },
          },
        ],
      ].filter(Boolean) as PluginItem[],
    });

    includedFiles.forEach((file) => {
      this.addDependency(normalize(file));
    });

    // @ts-ignore //
    callback(null, result?.code || "", result?.map ?? undefined);
  } catch (e: unknown) {
    const error = new Error(
      // @ts-expect-error Not checking for error type
      `[webpack-loader] Unhandled exception - ${e.message} ${e.stack}`
    );
    callback(error);
  }
}

export function pitch(this: LoaderContext<LoaderOptions>): void {
  // const options = getLoaderOptions(this);
  // if (!hasErrored && options.extract && !options[pluginName]) {
  //   this.emitError(
  //     new Error('[webpack-plugin]' + `You forgot to add the 'CompiledExtractPlugin' plugin (i.e \`{ plugins: [new CompiledExtractPlugin()] }\`), please read https://compiledcssinjs.com/docs/css-extraction-webpack`)
  //   );
  //   // We only want to error once, if we didn't do this you'd get an error for every file found.
  //   hasErrored = true;
  // }
}
