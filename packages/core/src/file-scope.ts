import type { FileScope } from './types';


const fileScopes: Array<FileScope> = [];

export function setFileScope(filePath: string, packageName?: string) {
  fileScopes.unshift({
    filePath,
    packageName,
  });
}

export function endFileScope() {
  fileScopes.shift();
}

export function hasFileScope() {
  return fileScopes.length > 0;
}

export function getFileScope(): FileScope {
  return fileScopes[0];
}