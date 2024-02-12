import { appendCss, applyCss } from "./adapter";
import { escapeClassName, escapeDisplayClassName, hashObject } from "./core";
import { CSSObjectType } from "./types";

const ruleMap = new Map<string, string>();

// Generate a classname based on an object
export function generateIdentifier(rule: CSSRule) {
  const hashedRule = hashObject(rule);
  
  return escapeClassName(hashedRule);
}

export function getClassName(rule: CSSRule, className?: string) {
  if (!className) {
    // eslint-disable-next-line no-param-reassign
    className = generateIdentifier(rule);
  }

  return className;
}

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
  const cacheKey = className || hashObject(rule);
  if (ruleMap.has(cacheKey)) {
    return ruleMap.get(cacheKey);
  }

  const selector = `.${getClassName(rule, className)}`;
  const cacheValue = escapeDisplayClassName(getClassName(rule, className));
  ruleMap.set(cacheKey, cacheValue);

  appendCss({
    type,
    selector,
    rule,
  });
  applyCss();

  return cacheValue
}