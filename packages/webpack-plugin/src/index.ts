import type { Compiler, RuleSetRule } from "webpack";
import { ChildCompiler } from "./compiler";
import { layerCakeFileFilter, LayerCakeOptions } from "@layer-cake/integration";

const pluginName = "LayerCakePlugin";

function markCSSFilesAsSideEffects(compiler: Compiler) {
  compiler.hooks.normalModuleFactory.tap(pluginName, (nmf) => {
    nmf.hooks.createModule.tap(
      pluginName,
      (createData: {
        matchResource?: string;
        settings?: { sideEffects?: boolean };
      }) => {
        if (
          createData.matchResource &&
          createData.matchResource.endsWith(".layerCake.css")
        ) {
          createData.settings = createData.settings || {};
          createData.settings.sideEffects = true;
        }
      }
    );
  });
}

export interface PluginOptions extends LayerCakeOptions {
  test?: RuleSetRule["test"];
  shouldProcessFile?: (filePath: string) => boolean | void;
  externals?: any;
}

export class LayerCakePlugin {
  test: RuleSetRule["test"];
  shouldProcessFile: undefined | ((filePath: string) => boolean | void);
  layerCakeOptions: LayerCakeOptions;

  childCompiler: ChildCompiler;

  constructor(options: PluginOptions = {}) {
    const {
      test = layerCakeFileFilter,
      shouldProcessFile,
      externals,
      ...layerCakeOptions
    } = options;

    this.test = test;
    this.shouldProcessFile = shouldProcessFile;
    this.layerCakeOptions = layerCakeOptions;

    this.childCompiler = new ChildCompiler(externals);
  }

  apply(compiler: Compiler) {
    markCSSFilesAsSideEffects(compiler);

    compiler.options.module?.rules.splice(0, 0, {
      test: this.test!,
      use: [
        {
          loader: require.resolve("../loader"),
          options: {
            layerCakeOptions: this.layerCakeOptions,
            childCompiler: this.childCompiler,
            shouldProcessFile: this.shouldProcessFile,
          },
        },
      ],
    });
  }
}
