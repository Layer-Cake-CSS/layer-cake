export const layerCakeFileFilter = /\.(js|mjs|cjs|jsx|ts|tsx)(\?used)?$/;
export const virtualCssFileFilter = /\.layerCake\.css\?source=.*$/;

export const DefaultLayerCakeOptions: LayerCakeOptions = {
  extract: true,
  disableRuntime: false,
};
export interface LayerCakeOptions {
  extract?: boolean; // extract css to file
  disableRuntime?: boolean; // disable runtime
}

export * from "./processFile";
export * from "./compile";
export * from "./ast-tools";
export * from "./serialize";
export * from "./virtual-file";
