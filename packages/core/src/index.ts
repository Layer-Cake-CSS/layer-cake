import "./adapters/runtime-adapter";
// TODO ssr adapter
// import "./adapters/ssr-adapter";
import { atoms } from "./atoms";
import { options } from "./core";
import { globalStyle } from "./global-style";
import { style } from "./style";


export {style} from './style'

export {atoms} from './atoms'

export {globalStyle} from './global-style'

export function createLayerCake(newOptions:any) {
  options.setOptions(newOptions);
  return {
    style,
    atoms,
    globalStyle
  }
}