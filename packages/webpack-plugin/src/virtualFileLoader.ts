import { deserializeCss } from "@layer-cake/integration";
import type { LoaderContext } from "webpack";

export default function VirtualFileLoader(
  this: LoaderContext<{
    source: string;
  }>
) {
  const { source } = this.getOptions();

  return deserializeCss(source);
}
