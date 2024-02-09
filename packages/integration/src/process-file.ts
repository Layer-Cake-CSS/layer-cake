import type { CSSObject } from "@layer-cake/core/types";
import type { Adapter } from "@layer-cake/core/adapter";
import { transformCss } from "@layer-cake/core/transform-css";
import {getFileScope} from "@layer-cake/core/file-scope";
import { inspect } from "node:util";
import evalCode from "eval";
import { DefaultLayerCakeOptions, LayerCakeOptions } from ".";
import { debug, formatResourcePath } from "./logger";

export interface ProcessFileOptions {
  source: string;
  filePath: string;
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

export function processFile(
  { source, filePath }: ProcessFileOptions,
  {
    extract = DefaultLayerCakeOptions.extract,
    disableRuntime = DefaultLayerCakeOptions.disableRuntime,
  }: LayerCakeOptions = {},
) {
  const log = debug(`layer-cake:processFile:${formatResourcePath(filePath)}`);

  const localClassNames = new Set<string>();
  const bufferedCSSObjects: Set<CSSObject> = new Set();

  let stringifiedCss = "";

  const staticExtractAdapter: Adapter = {
    appendCss(css: CSSObject) {
      console.log('APPEND CSS', css, getFileScope())
      bufferedCSSObjects.add(css);
    },
    registerClassName(className: string) {
      localClassNames.add(className);
    },
    applyCss() {
      stringifiedCss = transformCss([...bufferedCSSObjects]);
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
      CSS: {
        escape: (value: string) => value,
      }
    },
    true,
  );
  process.env.NODE_ENV = currentNodeEnvironment;

  
}
