import {
  compile,
  serialize,
  stringify,
  middleware,
  prefixer,
  Middleware,
} from "stylis";
import { kebabCase } from "change-case";
import { CSSObject, CSSRule } from "./types";

// Turn an object into a string of CSS properties, possibly recursively
export function stringifyCssRule(rule: CSSRule): string {
  // eslint-disable-next-line unicorn/no-array-reduce
  return Object.entries(rule).reduce((cssRule, [cssProperty, value]) => {
    if (typeof value === "object" && value !== null) {
      return `${cssRule}${cssProperty}{${stringifyCssRule(value)}}`;
    }
    return `${cssRule}${cssProperty}:${value};`;
  }, "");
}

const propertyNameCaseMiddleware: Middleware = (element) => {
  if (element.type === "decl" && typeof element.props === "string") {
    const originalProp = element.props;
    const newProp = kebabCase(originalProp);
    // eslint-disable-next-line no-param-reassign
    element.props = newProp;
    // eslint-disable-next-line no-param-reassign
    element.value = element.value.replace(originalProp, newProp);
  }
};

export function transformCssObject(cssObject: CSSObject) {
  const { selector, rule } = cssObject;

  const cssRule = stringifyCssRule(rule);

  const css = serialize(
    compile(`${selector} {${cssRule}}`),
    middleware([propertyNameCaseMiddleware, prefixer, stringify]),
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
