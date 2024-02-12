import { Element, compile } from "stylis";
import { escapeClassName, escapeDisplayClassName, hashObject } from "./core";
import { propertyNameToKebabCase, stringifyCssRule } from "./transform-css";
import { CSSPropertyName, CSSPropertyValue, CSSRule } from "./types";
import { appendCss, applyCss } from "./adapter";

const ruleMap = new Map<string, string>();

export function generateAtomicIdentifier(
  propertyName: CSSPropertyName,
  value: CSSPropertyValue,
  modifiers: string[],
) {
  const prefix = modifiers?.length ? `${modifiers.join(":")}:` : "";
  return escapeClassName(`${prefix}${propertyName}--${value}`);
}

export function generateAtomicClasses(atomicRule: CSSRule) {
  const classNames = [] as string[];

  const cssRule = stringifyCssRule(atomicRule);

  const atomVirtualClassName = "__ATOM__";

  const cssString = `.${atomVirtualClassName} {${cssRule}}`;

  const nodes = compile(cssString);

  function processRule(
    prop: string,
    node: Element,
    prefix: string = "",
    applyRule?: (argument0: any, argument1: any) => any,
  ) {
    const nodeClassName = prop;
    if (!nodeClassName || nodeClassName?.match(/\s+/)) {
      // Nested selectors are not supported
      return;
    }

    // Classname selectors are not allowed. There is probably a more robust way to check this, but this is fast
    if ([...nodeClassName.matchAll(/\./g)].length > 1) {
      return;
    }

    const nodePrefix = nodeClassName.replace(/^\.__ATOM__/, "");
    const [extraSelectors, ...psuedos] = nodePrefix.split(":");

    if (extraSelectors.length > 0) {
      // Complex selectors are not supported
      return;
    }

    for (const child of node.children) {
      if (typeof child !== "string" && child.type === "decl") {
        const propertyName = propertyNameToKebabCase(child.props as string);
        const className = `${prefix}${generateAtomicIdentifier(
          propertyName,
          child.children as string,
          psuedos,
        )}`;

        const selector =
          psuedos.length > 0
            ? `.${className}:${psuedos.join(":")}`
            : `.${className}`;

        const rule = { [selector]: { [propertyName]: child.children } };

        appendCss({
          type: "atomic",
          rule:
            typeof applyRule === "function"
              ? applyRule(rule, { selector, className, psuedos })
              : rule,
        });

        classNames.push(escapeDisplayClassName(className));
      }
    }
  }

  // This really only nicely supports `screen and (min-width: 200px) and (max-width: 600px)`
  // All other media queries will probably work, but the classnames will be a bit ugly. Maybe.
  function processMedia(prop: string, node: Element) {
    const prefix = escapeClassName(
      `${prop
        .toLowerCase()
        .replaceAll(/\s?and\s?/g, "-")
        .replaceAll(/[():]/g, "")
        .replaceAll("min-width", "min")
        .replaceAll("max-width", "max")}:`,
    );
    for (const child of node.children) {
      if (typeof child !== "string" && child.type === "rule") {
        for (const childRule of child.props) {
          processRule(childRule, child, prefix, (rule) => ({
            [node.value]: rule,
          }));
        }
      }
    }
  }

  function processNode(node: Element) {
    if (node.type === "rule") {
      for (const prop of node.props) {
        processRule(prop, node);
      }
    }
    if (node.type === "@media") {
      for (const prop of node.props) {
        processMedia(prop, node);
      }
    }
  }

  for (const node of nodes) {
    processNode(node);
  }

  applyCss();

  return classNames;
}

// Atoms only supports prop:value pairs & psuedo selectors
export function atoms(rule: any) {
  const cacheKey = hashObject(rule);
  if (ruleMap.has(cacheKey)) return ruleMap.get(cacheKey);

  const classNames = generateAtomicClasses(rule);

  const cacheValue = classNames.join(" ");

  ruleMap.set(cacheKey, cacheValue);
  return cacheValue;
}
