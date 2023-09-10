import { deserializeCss } from "./serialize";

export function getSourceFromVirtualCssFile(id: string) {
  const match = id.match(/^(?<fileName>.*)\?source=(?<source>.*)$/);

  if (!match || !match.groups) {
    throw new Error("No source in layer cake CSS file");
  }

  const source = deserializeCss(match.groups.source);

  return {
    fileName: match.groups.fileName,
    source,
  };
}
