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
    test("processes file - CJS, webpack", () => {
      const source = `
      /* harmony import */ var _layer_cake_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @layer-cake/core */ "@layer-cake/core");
    /* harmony import */ var _layer_cake_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_layer_cake_core__WEBPACK_IMPORTED_MODULE_0__);
    /* harmony import */ var react_dom_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react-dom/client */ "../../node_modules/react-dom/client.js");
    /* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "../../node_modules/react/jsx-runtime.js");
    
    const container = document.getElementById("root");
    
    // Create a root.
    const root = react_dom_client__WEBPACK_IMPORTED_MODULE_1__.createRoot(container);
    const className = (0,_layer_cake_core__WEBPACK_IMPORTED_MODULE_0__.style)({
      backgroundColor: "red"
    });
    
    // Initial render
    root.render( /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      className: (0,_layer_cake_core__WEBPACK_IMPORTED_MODULE_0__.style)({
        backgroundColor: "hotpink",
        color: "white",
        padding: "1rem"
      })
    }));
      `;

      const code = processFile({
        source,
        filePath: "test.js",
      });

      expect(code).not.toMatch(
        /\(0,_layer_cake_core__WEBPACK_IMPORTED_MODULE_0__\.style\)\(\{/
      );
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
