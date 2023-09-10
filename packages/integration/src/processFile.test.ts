import {
  evaluateStyleArgument,
  getLayerCakeReferences,
  processFile,
} from "./processFile";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import { parseAst } from "./ast-tools";
import type { Adapter } from "@layer-cake/core/adapter";
import { CSSObject } from "@layer-cake/core/types";

const mockAdapter: Adapter = {
  appendCss: (css: CSSObject) => {},
  registerClassName: (className: string) => {},
  applyCss: () => {},
};

describe("processFile", () => {
  describe("evaluateStyleArgument", () => {
    test("evaluates path", () => {
      const ast = parseAst(`
        import { style } from "@layer-cake/core";
        const color = "red";
        const bg = "blue";
        const className = style({
          color,
          background: 'blue',
        });
        `);

      traverse(ast, {
        CallExpression(path) {
          if (
            t.isIdentifier(path.node.callee) &&
            path.node.callee.name === "style"
          ) {
            const evaluated = evaluateStyleArgument(
              path.get("arguments")[0],
              "test.js",
              mockAdapter
            );
            expect(evaluated).toEqual(expect.any(String));
          }
        },
      });
    });

    test("react", () => {
      const source = `import { jsx } from "react/jsx-runtime";
      import { style } from "@layer-cake/core";
      import ReactDOM from "react-dom/client";
      const container = document.getElementById("root");
      const root = ReactDOM.createRoot(container);
      const className = style({
        backgroundColor: "red"
      });
      root.render(
        /* @__PURE__ */ jsx(
          "div",
          {
            className: style({
              backgroundColor: "hotpink",
              color: "white",
              padding: "1rem"
            })
          }
        )
      );
      `;

      const ast = parseAst(source);

      traverse(ast, {
        CallExpression(path) {
          if (
            t.isIdentifier(path.node.callee) &&
            path.node.callee.name === "style"
          ) {
            const evaluated = evaluateStyleArgument(
              path.get("arguments")[0],
              "test.js",
              mockAdapter
            );
            expect(evaluated).toEqual(expect.any(String));
          }
        },
      });
    });
  });

  describe("getLayerCakeReferences", () => {
    test("handles import {style}", () => {
      const ast = parseAst(`
      import { style as st } from "@layer-cake/core";
      const className = st({
        color: 'red'
      });`);

      const layerCakeReferences = getLayerCakeReferences(ast);

      expect(layerCakeReferences).toHaveLength(1);
      expect(layerCakeReferences[0].localName).toEqual("st");
      expect(layerCakeReferences[0].importedName).toEqual("style");
      expect(layerCakeReferences[0].path).toEqual(expect.any(Object));
    });
    test("handles default import", () => {
      const ast = parseAst(`
      import lc from "@layer-cake/core";
      const className = lc.style({
        color: 'red'
      });`);

      const layerCakeReferences = getLayerCakeReferences(ast);

      expect(layerCakeReferences).toHaveLength(1);
      expect(layerCakeReferences[0].localName).toEqual("lc");
      expect(layerCakeReferences[0].importedName).toEqual("default");
      expect(layerCakeReferences[0].path).toEqual(expect.any(Object));
    });
    test("handles default require", () => {
      const ast = parseAst(`
      const lc = require("@layer-cake/core");
      const className = lc.style({
        color: 'red'
      });`);

      const layerCakeReferences = getLayerCakeReferences(ast);

      expect(layerCakeReferences).toHaveLength(1);
      expect(layerCakeReferences[0].localName).toEqual("lc");
      expect(layerCakeReferences[0].importedName).toEqual("default");
      expect(layerCakeReferences[0].path).toEqual(expect.any(Object));
    });

    test("handles destructured require", () => {
      const ast = parseAst(`
      const { style } = require("@layer-cake/core");
      const className = style({
        color: 'red'
      });`);

      const layerCakeReferences = getLayerCakeReferences(ast);

      expect(layerCakeReferences).toHaveLength(1);
      expect(layerCakeReferences[0].localName).toEqual("style");
      expect(layerCakeReferences[0].importedName).toEqual("style");
      expect(layerCakeReferences[0].path).toEqual(expect.any(Object));
    });

    test("handles destructured require with rest", () => {
      const ast = parseAst(`
      const {...lc} = require("@layer-cake/core");
      const className = lc.style({
        color: 'red'
      });`);

      const layerCakeReferences = getLayerCakeReferences(ast);

      expect(layerCakeReferences).toHaveLength(1);
      expect(layerCakeReferences[0].localName).toEqual("lc");
      expect(layerCakeReferences[0].importedName).toEqual("default");
      expect(layerCakeReferences[0].path).toEqual(expect.any(Object));
    });
  });

  describe("processFile", () => {
    test("processes file - CJS", () => {
      const source = `import { jsx } from "react/jsx-runtime";
      const { style } = require("@layer-cake/core");
      const className = style({
        color: 'red'
      });`;

      const code = processFile({
        source,
        filePath: "test.js",
      });

      expect(code).not.toMatch(/style\(/);
    });
    test("processes file - CJS, sequence expression", () => {
      const source = `
      var import_core = require("@layer-cake/core");
      const className = (0, import_core.style)({
          backgroundColor: "hotpink",
          color: "white",
          padding: "1rem"
        });`;

      const code = processFile({
        source,
        filePath: "test.js",
      });

      expect(code).not.toMatch(/\(0, import_core\.style\)\(\{/);
    });
    test("processes file - ESM", () => {
      const source = `import { jsx } from "react/jsx-runtime";
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
              color: ()=>{
                return Math.random() > 0.5 ? "white" : "black";
              },
              padding: "1rem"
            })
          }
        )
      );`;

      const code = processFile({
        source,
        filePath: "test.js",
      });

      expect(code).toEqual(expect.any(String));
      expect(code).not.toMatch(/style\(/);
    });
  });
});
