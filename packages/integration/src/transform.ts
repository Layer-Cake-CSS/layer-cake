import { addFileScope } from "./add-file-scope";

export interface TransformOptions {
  source: string;
  filePath: string;
  rootPath: string;
  packageName: string;
}

export function transform({
  source,
  filePath,
  rootPath,
  packageName,
}: TransformOptions): string {
  return addFileScope({
    source,
    filePath,
    rootPath,
    packageName,
  });
}
