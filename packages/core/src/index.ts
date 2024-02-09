import "./adapters/runtime-adapter";
// TODO ssr adapter
// import "./adapters/ssr-adapter";
import cssesc from "cssesc";
import hyphenate from "hyphenate-style-name";
import { appendCss, applyCss } from "./adapter";
import {
  CSSRule,
  CSSPropertyName,
  CSSPropertyValue,
  CSSObjectType,
} from "./types";

const ruleMap = new Map<string, string>();

export function style(
  rule: any,
  {
    className,
    type = "local" as CSSObjectType,
  }: {
    className?: string;
    type?: CSSObjectType;
  } = {}
) {
  const parsedRule = parseRule(rule);

  const cacheKey = className || hashObject(parsedRule);
  if (ruleMap.has(cacheKey)) {
    return ruleMap.get(cacheKey);
  }

  const cacheValue = generateClass(parsedRule, className);
  ruleMap.set(cacheKey, cacheValue);

  appendCss({
    type,
    selector: `.${cacheValue}`,
    rule: parsedRule,
  });
  applyCss();

  return cacheValue;
}

export function atoms(rule: any) {
  const parsedRule = parseRule(rule);

  const cacheKey = hashObject(parsedRule);
  if (ruleMap.has(cacheKey)) return ruleMap.get(cacheKey);
  const classNames = generateAtomicClasses(parsedRule);

  const cacheValue = classNames.join(" ");

  ruleMap.set(cacheKey, cacheValue);
  return cacheValue;
}

export function parseRule(rule: CSSRule) {
  const parsedArray = Object.entries(rule)
    .filter(([_, value]) => {
      if (typeof value === "function") return false;
      return typeof value !== "undefined";
    })
    .map(([propertyName, value]) => {
      const cssProperty = hyphenate(propertyName);
      return [cssProperty, value];
    });

  return Object.fromEntries(parsedArray);
}

export function hashObject<InputObject extends Record<string, any>>(
  object: InputObject
) {
  const stringifiedObject = JSON.stringify(object);
  const hash = stringifiedObject.split("").reduce((hash, char) => {
    const charCode = char.charCodeAt(0);
    const newHash = (hash << 5) - hash + charCode;
    return newHash & newHash;
  }, 0);
  return hash.toString(36);
}

export function escapeClassName(className: string) {
  return cssesc(className.replaceAll(/\s+/g,'-'), {
    isIdentifier: true,
  });
}

export function generateIdentifier(rule: CSSRule) {
  const hashedRule = hashObject(rule);

  // cannot start with a digit, two hyphens, or a hyphen followed by a digit

  let hashedIdentifier = hashedRule;
  if (
    hashedIdentifier.match(/^[0-9]/) ||
    hashedIdentifier.match(/^-{2}/) ||
    hashedIdentifier.match(/^-{1}[0-9]/)
  ) {
    hashedIdentifier = `_${hashedIdentifier}`;
  }

  return escapeClassName(hashedIdentifier);
}

export function generateClass(rule: CSSRule, className?: string) {
  if (!className) {
    className = generateIdentifier(rule);
  }

  return className;
}

export function generateAtomicIdentifier(
  propertyName: CSSPropertyName,
  value: CSSPropertyValue
) {
  return escapeClassName(`${propertyName}--${value}`);
}

export function generateAtomicClasses<Rule extends CSSRule>(rule: Rule) {
  const classNames = [];
  for (const [propertyName, value] of Object.entries(rule)) {
    const cssProperty = hyphenate(propertyName);
    const className = generateAtomicIdentifier(cssProperty, value);

    classNames.push(
      style(
        { [cssProperty]: value },
        {
          className,
          type: "atomic",
        }
      )
    );
  }

  return classNames;
}
