import { FileScope } from "./types";

interface InjectStylesOptions {
  fileScope: FileScope;
  css: string;
}

const stylesheets: Record<string, HTMLElement> = {};
export const injectStyles = ({ fileScope, css }: InjectStylesOptions) => {
  const fileScopeId = fileScope.packageName
    ? [fileScope.packageName, fileScope.filePath].join("/")
    : fileScope.filePath;

  let stylesheet = stylesheets[fileScopeId];

  if (!stylesheet) {
    const styleElement = document.createElement("style");
    styleElement.dataset.file = fileScopeId;
    styleElement.setAttribute("type", "text/css");
    stylesheet = styleElement;
    stylesheets[fileScopeId] = stylesheet;
    document.head.append(styleElement);
  }

  stylesheet.innerHTML = css;
};
