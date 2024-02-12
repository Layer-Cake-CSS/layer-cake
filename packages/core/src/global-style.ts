import { appendCss, applyCss } from "./adapter";

export function globalStyle(css:any) {

  appendCss({
    type: "global",
    selector: "",
    rule: css,
  });
  applyCss();
}