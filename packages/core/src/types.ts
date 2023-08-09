export type CSSSelector = string;
export type CSSPropertyName = string;
export type CSSPropertyValue = string | number;
export type CSSRule = Record<CSSPropertyName, CSSPropertyValue>;

export type CSSObjectType = "local" | "global" | "atomic";

export type CSSObject = {
  type: CSSObjectType;
  selector: CSSSelector;
  rule: CSSRule;
};
