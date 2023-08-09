import type { Compiler, RuleSetRule } from "webpack";
import { layerCakeFileFilter } from "@layer-cake/integration";

interface PluginOptions {
  test?: RuleSetRule["test"];
  compile?: boolean;
  extract?: boolean;
}
export class LayerCakePlugin {
  test: RuleSetRule["test"];
  compile: boolean;
  extract: boolean;

  constructor(options: PluginOptions = {}) {
    const {
      test = layerCakeFileFilter,
      compile = true,
      extract = false,
    } = options;

    this.test = test;
    this.compile = compile;
    this.extract = extract;
  }

  apply(compiler: Compiler) {
    // Add our loader last in the list of loaders
    compiler.options.module?.rules.splice(0, 0, {
      test: this.test!,
      use: [
        {
          loader: require.resolve("../loader"),
          options: {},
        },
      ],
    });
  }
}
