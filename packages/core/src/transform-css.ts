import { compile, serialize, stringify, middleware, prefixer } from "stylis";
import { CSSObject, CSSRule } from "./types";

export function stringifyCssRule(rule: CSSRule) {
  let cssRule = "";
  for (const [cssProperty, value] of Object.entries(rule)) {
    cssRule += `${cssProperty}:${value};`;
  }
  return cssRule;
}

export function transformCssObject(cssObject: CSSObject) {
  const { selector, rule } = cssObject;

  const cssRule = stringifyCssRule(rule);

  const css = serialize(
    compile(`${selector}{${cssRule}}`),
    middleware([prefixer, stringify])
  );

  return css;
}

export function transformCss(cssObjects: CSSObject[]) {
  let css = "";
  for (const cssObject of cssObjects) {
    css += transformCssObject(cssObject);
  }
  return css;
}
