export const DefaultLayerCakePluginOptions: LayerCakePluginOptions = {
  extract: true,
  disableRuntime: false,
};
export interface LayerCakePluginOptions {
  extract?: boolean; // extract css to file
  disableRuntime?: boolean; // disable runtime
}
