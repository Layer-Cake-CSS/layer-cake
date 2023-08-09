import type { CSSObject } from "../types";
import { Adapter, setAdapterIfNotSet } from "../adapter";
import { injectStyles } from "../inject-styles";
import { transformCss } from "../transform-css";

const localClassNames = new Set<string>();
let bufferedCSSObjects: Array<CSSObject> = [];

export const browserRuntimeAdapter: Adapter = {
  appendCss(css) {
    bufferedCSSObjects.push(css);
  },
  registerClassName(className: string) {
    localClassNames.add(className);
  },
  applyCss() {
    const css = transformCss(bufferedCSSObjects);
    injectStyles({ css, filePath: "unknown" });
  },
};

if (typeof window !== "undefined") {
  setAdapterIfNotSet(browserRuntimeAdapter);
}
