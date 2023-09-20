// Heavily borrowed from Vanilla-Extract. Many thanks Vanilla-Extract team!

import type { ExternalsPlugin, LoaderContext } from "webpack";

// Should be "ExternalsItem" but webpack doesn't expose it
type Externals = ExternalsPlugin["externals"];

interface CompilationResult {
  source: string;
  fileDependencies: Array<string>;
  contextDependencies: Array<string>;
}

const getCompilerName = (resource: string) => `layer-cake-compiler:${resource}`;

export class ChildCompiler {
  externals: Externals | undefined;

  constructor(externals: Externals) {
    this.externals = externals;
  }

  isChildCompiler(name: string | undefined) {
    return typeof name === "string" && name.startsWith("layer-cake-compiler");
  }

  async getCompiledSource(loader: LoaderContext<any>) {
    const { source, fileDependencies, contextDependencies } =
      await compileLayerCakeSource(loader, this.externals);

    // Set loader dependencies to dependencies of the child compiler
    fileDependencies.forEach((dep) => {
      loader.addDependency(dep);
    });
    contextDependencies.forEach((dep) => {
      loader.addContextDependency(dep);
    });

    return {
      source,
      dependencies: fileDependencies,
    };
  }
}

function getRootCompilation(loader: LoaderContext<any>) {
  var compiler = loader._compiler!;
  var compilation = loader._compilation;
  while (compiler.parentCompilation) {
    compilation = compiler.parentCompilation;
    compiler = compilation.compiler;
  }
  return compilation;
}

function compileLayerCakeSource(
  loader: LoaderContext<any>,
  externals: Externals | undefined
): Promise<CompilationResult> {
  return new Promise((resolve, reject) => {
    // Child compiler will compile layer-cake files to be evaled during compilation
    const outputOptions = { filename: loader.resourcePath };

    const compilerName = getCompilerName(loader.resourcePath);
    const childCompiler = getRootCompilation(loader)!.createChildCompiler(
      compilerName,
      outputOptions,
      []
    );

    const NodeTemplatePlugin =
      loader._compiler!.webpack.node.NodeTemplatePlugin;
    const NodeTargetPlugin = loader._compiler!.webpack.node.NodeTargetPlugin;
    const LimitChunkCountPlugin =
      loader._compiler!.webpack.optimize.LimitChunkCountPlugin;
    const ExternalsPlugin = loader._compiler!.webpack.ExternalsPlugin;

    new NodeTemplatePlugin(outputOptions).apply(childCompiler);
    new NodeTargetPlugin().apply(childCompiler);

    const { EntryOptionPlugin } = loader._compiler!.webpack;

    EntryOptionPlugin.applyEntryOption(childCompiler, loader.context, {
      child: {
        import: [loader.resourcePath],
      },
    });

    new LimitChunkCountPlugin({ maxChunks: 1 }).apply(childCompiler);

    const _externals: Externals = ["@layer-cake/core"];
    if (Array.isArray(externals)) {
      _externals.push(...externals);
    } else if (externals) {
      _externals.push(externals);
    }
    new ExternalsPlugin("commonjs", _externals).apply(childCompiler);

    let source: string;

    childCompiler.hooks.compilation.tap(compilerName, (compilation) => {
      compilation.hooks.processAssets.tap(compilerName, () => {
        source =
          compilation.assets[loader.resourcePath]! &&
          (compilation.assets[loader.resourcePath]!.source() as string);

        // Remove all chunk assets
        compilation.chunks.forEach((chunk) => {
          chunk.files.forEach((file) => {
            compilation.deleteAsset(file);
          });
        });
      });
    });

    try {
      childCompiler.runAsChild((err, _entries, compilation) => {
        if (err) {
          return reject(err);
        }

        if (!compilation) {
          return reject(
            new Error("Missing compilation in child compiler result")
          );
        }

        if (compilation.errors.length > 0) {
          return reject(compilation.errors[0]);
        }
        if (!source) {
          return reject(new Error("Didn't get a result from child compiler"));
        }

        resolve({
          source,
          fileDependencies: Array.from(compilation.fileDependencies),
          contextDependencies: Array.from(compilation.contextDependencies),
        });
      });
    } catch (e) {
      reject(e);
    }
  });
}
