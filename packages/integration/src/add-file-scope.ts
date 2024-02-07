import { posix, relative, sep } from "node:path";
import { detectSyntax } from "mlly";

interface AddFileScopeOptions {
  source: string;
  filePath: string;
  rootPath: string;
  packageName: string;
}

export function addFileScope({
  source,
  filePath,
  rootPath,
  packageName,
}: AddFileScopeOptions) {
  // Encode windows file paths as posix
  const normalizedPath = posix.join(...relative(rootPath, filePath).split(sep));

  if (source.includes("@layer-cake/core/file-scope")) {
    return source.replace(
      /setFileScope\(((\n|.)*?)\)/,
      `setFileScope("${normalizedPath}", "${packageName}")`,
    );
  }

  const { hasESM, isMixed } = detectSyntax(source);

  if (hasESM && !isMixed) {
    return `
      import { setFileScope, endFileScope } from "@layer-cake/core/file-scope";
      setFileScope("${normalizedPath}", "${packageName}");
      ${source}
      endFileScope();
    `;
  }

  return `
    const __layer_cake_filescope__ = require("@layer-cake/core/file-scope");
    __layer_cake_filescope__.setFileScope("${normalizedPath}", "${packageName}");
    ${source}
    __laye_cake_filescope__.endFileScope();
  `;
}
