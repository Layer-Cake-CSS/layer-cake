import { stringifyCssRule, transformCssObject } from "./transform-css";

describe("stringifyCssRule", () => {
  test("it should stringify pseudo classes", () => {
    expect(
      stringifyCssRule({
        color: "blue",
        "&:hover": {
          color: "red",
        },
      }),
    ).toEqual("color:blue;&:hover{color:red;}");
  });
});

test("it should handle pseudo classes", () => {
  expect(
    transformCssObject({
      selector: "a",
      rule: {
        color: "blue",
        "&:hover": {
          color: "red",
        },
      },
    }),
  ).toEqual("a{color:blue;}a:hover{color:red;}");
});
