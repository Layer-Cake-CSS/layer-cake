import type { CSSObject } from "./types";

export interface Adapter {
  appendCss: (css: CSSObject) => void;
  registerClassName: (className: string) => void;
  applyCss: () => void;
}

const adapterStack: Array<Adapter> = [];

export function setAdapter(adapter: Adapter) {
  adapterStack.push(adapter);
}
export function setAdapterIfNotSet(adapter: Adapter) {
  if (adapterStack.length === 0) {
    setAdapter(adapter);
  }
}

export function currentAdapter() {
  if (adapterStack.length === 0) {
    throw new Error("No adapter found");
  }
  return adapterStack[adapterStack.length - 1];
}

export const registerClassName: Adapter["registerClassName"] = (...props) => {
  return currentAdapter().registerClassName(...props);
};

export const appendCss: Adapter["appendCss"] = (...props) => {
  return currentAdapter().appendCss(...props);
};

export const applyCss: Adapter["applyCss"] = () => {
  return currentAdapter().applyCss();
};
