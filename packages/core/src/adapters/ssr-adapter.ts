import type { CSSObject } from "../types";
import { Adapter, setAdapterIfNotSet } from "../adapter";
import { transformCss } from "../transform-css";

const localClassNames = new Set<string>();
const bufferedCSSObjects: Array<CSSObject> = [];

export const ssrRuntimeAdapter: Adapter = {
  appendCss(css: CSSObject) {
    bufferedCSSObjects.push(css);
  },
  registerClassName(className: string) {
    localClassNames.add(className);
  },
  applyCss() {
    // TODO
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const css = transformCss(bufferedCSSObjects);
    // TODO need to inline <style> tag, but we cannot do this ourselves
    // The approach is framework dependent, so we need to know what to expose to the user
  },
};

if (typeof window === "undefined") {
  setAdapterIfNotSet(ssrRuntimeAdapter);
}
