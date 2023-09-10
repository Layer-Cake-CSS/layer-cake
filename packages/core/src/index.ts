import "./adapters/runtime-adapter";
// TODO ssr adapter
// import "./adapters/ssr-adapter";

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
    type,
  }: {
    className?: string;
    type: CSSObjectType;
  } = {
    type: "local",
  }
) {
  const cacheKey = className || hashObject(rule);
  if (ruleMap.has(cacheKey)) return ruleMap.get(cacheKey);

  const cacheValue = generateClass(rule, className);
  ruleMap.set(cacheKey, cacheValue);

  const parsedRule = parseRule(rule);

  appendCss({
    type,
    selector: `.${cacheValue}`,
    rule: parsedRule,
  });
  applyCss();

  return cacheValue;
}

export function atoms(rule: any) {
  const cacheKey = hashObject(rule);
  if (ruleMap.has(cacheKey)) return ruleMap.get(cacheKey);
  const classNames = generateAtomicClasses(rule);

  const cacheValue = classNames.join(" ");

  ruleMap.set(cacheKey, cacheValue);
  return cacheValue;
}

export function parseRule(rule: CSSRule) {
  const parsedRule = {} as CSSRule;
  for (const [propertyName, value] of Object.entries(rule)) {
    const cssProperty = hyphenate(propertyName);
    parsedRule[cssProperty] = value;
  }
  return parsedRule;
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

export function generateIdentifier(rule: CSSRule) {
  const hashedRule = hashObject(rule);

  const hashedIdentifier = hashedRule.match(/^[0-9]/)
    ? `_${hashedRule}`
    : hashedRule;

  // return CSS.escape(hashedIdentifier);
  // TODO - escape the identifier
  return hashedIdentifier;
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
  return CSS.escape(`${propertyName}--${value}`);
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
