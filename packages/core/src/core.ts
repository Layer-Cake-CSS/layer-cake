import cssesc from "cssesc";
import { LayerCakeOptions } from "./types";

export function hashObject<InputObject extends Record<string, any>>(
  object: InputObject,
) {
  const stringifiedObject = JSON.stringify(object);
  // eslint-disable-next-line unicorn/no-array-reduce
  const hashedObject = [...stringifiedObject].reduce((hash, char) => {
    const charCode = char.codePointAt(0)!;
    // eslint-disable-next-line no-bitwise
    const newHash = (hash << 5) - hash + charCode;
    // eslint-disable-next-line no-bitwise
    return newHash & newHash;
  }, 0);
  return hashedObject.toString(36);
}

export function escapeClassName(className: string) {
  // Replace spaces with hyphens, & escape characters that aren't allowed in CSS class names
  let escapedClassName = cssesc(className.replaceAll(/\s+/g, "-"), {
    isIdentifier: true,
  });

  // cannot start with a digit, two hyphens, or a hyphen followed by a digit
  if (
    /^\d/.test(escapedClassName) ||
    /^-{2}/.test(escapedClassName) ||
    /^-\d/.test(escapedClassName)
  ) {
    escapedClassName = `_${escapedClassName}`;
  }

  return escapedClassName;
}

export function escapeDisplayClassName(className: string) {
  // return className.replaceAll(/\\:/g,':')
  return className.replaceAll("\\", "");
}

export const options = (() => {
  // eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
  let _options = {};
  return {
    setOptions(newOptions: LayerCakeOptions) {
      _options = newOptions;
    },
    getOptions() {
      return _options;
    },
  };
})();
