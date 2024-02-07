import { packageUpSync } from "package-up";
import { dirname, resolve } from "node:path";
import {readFileSync} from 'node:fs'

export interface PackageInfo {
  name: string;
  path: string;
  dirname: string;
}

function readJsonSync(path: string) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

export function getClosestPackageJson(
  startDirectory: string,
): PackageInfo | null {
  const packageJsonPath = packageUpSync({ cwd: startDirectory });

  if (packageJsonPath) {
    const { name } = readJsonSync(packageJsonPath);

    return {
      name,
      path: packageJsonPath,
      dirname: dirname(packageJsonPath),
    };
  }

  return null;
}

const packageInfoCache = new Map<string, PackageInfo>();

export function getPackageInfo(cwd?: string | null): PackageInfo {
  const resolvedCwd = cwd ?? process.cwd();
  const cachedValue = packageInfoCache.get(resolvedCwd);

  if (cachedValue) {
    return cachedValue;
  }

  let packageInfo = getClosestPackageJson(resolvedCwd);

  while (packageInfo && !packageInfo.name) {
    packageInfo = getClosestPackageJson(resolve(packageInfo.dirname, ".."));
  }

  if (!packageInfo || !packageInfo.name) {
    throw new Error(
      `Couldn't find parent package.json with a name field from '${resolvedCwd}'`,
    );
  }

  packageInfoCache.set(resolvedCwd, packageInfo);

  return packageInfo;
}
