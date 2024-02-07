// import type { CSSObject } from "./types";

type CSSObject = any;

console.log('Load ADAPTER')
export interface Adapter {
  appendCss: (css: CSSObject) => void;
  registerClassName: (className: string) => void;
  applyCss: () => void;
}

const adapterStack: Array<Adapter> = [];

export function setAdapter(adapter: Adapter) {
  console.log('Set adapter', adapter)
  adapterStack.push(adapter);
}
export function setAdapterIfNotSet(adapter: Adapter) {
  if (adapterStack.length === 0) {
    setAdapter(adapter);
  }
}

export function currentAdapter() {
  console.log('current adapter', adapterStack)
  if (adapterStack.length === 0) {
    throw new Error("No adapter found");
  }
  return adapterStack.at(-1);
}

export const registerClassName: Adapter["registerClassName"] = (...properties) => currentAdapter()?.registerClassName(...properties);

export const appendCss: Adapter["appendCss"] = (...properties) => currentAdapter()?.appendCss(...properties);

export const applyCss: Adapter["applyCss"] = () => currentAdapter()?.applyCss();
