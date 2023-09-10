import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { collectScope, parseAst } from "./ast-tools";

describe("collectScope", () => {
  test("collects scope", () => {
    const ast = parseAst(`
    import { jsx } from "react/jsx-runtime";
    import { style } from "@layer-cake/core";
    import ReactDOM from "react-dom/client";
    const container = document.getElementById("root");
    const root = ReactDOM.createRoot(container);
    const color = "red";
    root.render(
      /* @__PURE__ */ jsx(
        "div",
        {
          className: style({
            backgroundColor: "hotpink",
            color,
            padding: "1rem"
          })
        }
      )
    );
      `);

    traverse(ast, {
      CallExpression(path) {
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === "style"
        ) {
          const scope = collectScope(path);
          expect(scope).toHaveLength(1);
          expect(scope).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                declarations: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.objectContaining({
                      name: "color",
                      type: "Identifier",
                    }),
                    init: expect.objectContaining({
                      type: "StringLiteral",
                      value: "red",
                    }),
                    type: "VariableDeclarator",
                  }),
                ]),
                kind: "const",
                type: "VariableDeclaration",
              }),
            ])
          );
        }
      },
    });
  });
});
