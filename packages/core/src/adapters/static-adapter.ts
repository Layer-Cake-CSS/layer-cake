import { Adapter } from "../adapter";
import { getFileScope } from "../file-scope";
import { CSSObject, FileScope } from "../types";

export function stringifyFileScope({
  packageName,
  filePath,
}: FileScope): string {
  return packageName ? `${filePath}$$$${packageName}` : filePath;
}

export function StaticExtractAdapter() {
  const cssByFileScope = new Map<string, Array<CSSObject>>();
  const localClassNames = new Set<string>();

  const staticExtractAdapter: Adapter = {
    appendCss(css) {
      const serialisedFileScope = stringifyFileScope(getFileScope());
      const fileScopeCss = cssByFileScope.get(serialisedFileScope) ?? [];

      fileScopeCss.push(css);

      cssByFileScope.set(serialisedFileScope, fileScopeCss);
    },
    registerClassName(className: string) {
      localClassNames.add(className);
    },
    applyCss() {},
  };

  return {
    adapter: staticExtractAdapter,
    cssByFileScope,
    localClassNames,
  };
}
