export const DefaultLayerCakeOptions: LayerCakeOptions = {
  extract: true,
  disableRuntime: false,
};
export interface LayerCakeOptions {
  extract?: boolean; // extract css to file
  disableRuntime?: boolean; // disable runtime
}

export * from "./process-file";
export * from "./compile";
export * from "./serialize";
export * from "./virtual-file";
export * from "./filters";
export * from "./package-info";
