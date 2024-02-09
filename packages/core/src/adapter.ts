// import type { CSSObject } from "./types";

type CSSObject = any;

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
  return adapterStack.at(-1);
}

export const registerClassName: Adapter["registerClassName"] = (...properties) => currentAdapter()?.registerClassName(...properties);

export const appendCss: Adapter["appendCss"] = (...properties) => currentAdapter()?.appendCss(...properties);

export const applyCss: Adapter["applyCss"] = () => currentAdapter()?.applyCss();
