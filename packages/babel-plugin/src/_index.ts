import { resolve, basename, join, dirname } from "path";
import * as parser from "@babel/parser";
import { declare } from "@babel/helper-plugin-utils";
// import template from "@babel/template";
import traverse, { NodePath, Scope } from "@babel/traverse";
import * as t from "@babel/types";
import {
  PluginPass,
  transformFromAstAsync,
  transformFromAstSync,
  types,
} from "@babel/core";
import { parse } from "@babel/parser";
import generate from "@babel/generator";

import cloneDeep from "lodash.clonedeep";
import { style } from "@layer-cake/core";
import template from "@babel/template";

import vm from "vm";

import * as babel from "@babel/core";

const cwd = process.cwd();

// import { Cache } from "./utils/cache";

const packageJson = require("../package.json");
const LAYER_CAKE_MODULE = "@layer-cake/core";

// let globalCache: Cache | undefined;

interface State extends PluginPass {
  layerCakeImports?: {
    style?: string;
    atoms?: string;
    // keyframes?: string;
  };
  state: Set<string>;
  pathsToCleanup: { action: "replace" | "remove"; path: NodePath }[];
}

export const isLayerCakeStyleCallExpression = (
  node: t.Expression,
  state: State
): node is t.CallExpression => {
  return (
    t.isCallExpression(node) &&
    t.isIdentifier(node.callee) &&
    [state.layerCakeImports?.style].includes(node.callee.name)
  );
};

export const isLayerCakeAtomsCallExpression = (
  node: t.Expression,
  state: State
): node is t.CallExpression => {
  return (
    t.isCallExpression(node) &&
    t.isIdentifier(node.callee) &&
    [state.layerCakeImports?.atoms].includes(node.callee.name)
  );
};

// const evaluateExpression = <Expression extends t.Expression>(
//   expression: Expression
// ) => {
//   traverse(expression, {
//     noScope: true,
//     ObjectProperty: {
//       exit(path) {
//         // @ts-ignore
//         // console.log(path.node.key.name, path.node.value.value);
//         // if (t.isIdentifier(path.node.key, { name: referenceName })) {
//         //   objectPatternValueNode = path.node.value;

//         //   path.stop();
//         // }

//         // @ts-ignore
//         // styleObject[path.node.key.name] = path.node.value.value;

//         // console.log(path.node.key.name, path.node.value);

//         console.log(path.node.key.name, "=", path.node.value.value);

//         // if ("name" in path.node.value) {
//         // console.log("var - ", path.node.value.name);
//         // }
//         console.log(path.node.value);
//       },
//     },
//   });

//   return {};
// };

// const collectContext = (scope: Scope) => {
//   const context = [];

//   for (const k in scope.bindings) {
//     const binding = scope.bindings[k];
//     if (!binding) {
//       console.log("collectContext: empty binding", k);
//       continue;
//     }
//     console.log("collectContext: ", binding.path.node.type, binding.path.node);
//     if (binding.path.node.type === "FunctionDeclaration") {
//       context.push(
//         t.variableDeclaration("const", [
//           t.variableDeclarator(
//             binding.identifier,
//             t.functionExpression(
//               binding.path.node.id,
//               binding.path.node.params,
//               binding.path.node.body
//             )
//           ),
//         ])
//       );
//     } else if (binding.path.node.type === "VariableDeclarator") {
//       const init = binding.path.node.init;
//       // console.log("collectContext: init", init);
//       context.push(t.variableDeclaration("const", [binding.path.node]));
//       // if (
//       //   // @ts-ignore
//       //   (init && !init.callee) ||
//       //   // @ts-ignore
//       //   init.callee.name !== "style"
//       // ) {
//       // }
//     } else {
//       console.log("collectContext: unknown node type", binding.path.node.type);
//     }
//   }

//   return context;
// };

function evaluateCssObjectFunction(cssObjectFunction: string) {
  const ast = parser.parse(`(${cssObjectFunction})()`);
  const scope = new Set<string>();
  let cssObject;

  traverse(ast, {
    FunctionExpression(path) {
      if (path.parent.type === "CallExpression") {
        const [fn] = path.node.params;
        // @ts-ignore
        traverse(fn.body, {
          // @ts-ignore
          ReferencedIdentifier(identifierPath) {
            const { name } = identifierPath.node;
            // @ts-ignore
            if (!fn.params.some((param) => param.name === name)) {
              scope.add(name);
            }
          },
        });

        const { confident, value } = path.get("body").evaluate();
        if (confident) {
          cssObject = value;
        }
      }
    },
  });

  const evaluatedScope = Array.from(scope).reduce((acc, name) => {
    // @ts-ignore
    acc[name] = eval(name);
    return acc;
  }, {});

  return { cssObject, scope: evaluatedScope };
}

const collectContext = (ast: t.File) => {
  const scope = new Set<string>();

  traverse(ast, {
    VariableDeclarator(path) {
      const id = path.node.id;
      if (id.type === "Identifier") {
        scope.add(id.name);
      } else if (id.type === "ObjectPattern") {
        id.properties.forEach((property) => {
          if (
            property.type === "ObjectProperty" &&
            property.key.type === "Identifier"
          ) {
            scope.add(property.key.name);
          } else if (
            property.type === "RestElement" &&
            property.argument.type === "Identifier"
          ) {
            scope.add(property.argument.name);
          }
        });
      }
    },
    FunctionDeclaration(path) {
      const id = path.node.id;
      if (id && id.type === "Identifier") {
        scope.add(id.name);
      }
    },
    FunctionExpression(path) {
      const id = path.node.id;
      if (id && id.type === "Identifier") {
        scope.add(id.name);
      }
    },
  });

  return scope;
};

const generateClassName = (cssObject: t.ObjectExpression) => {
  const className = t.callExpression(
    t.memberExpression(t.identifier("css"), t.identifier("getClassName")),
    [cssObject]
  );
  return className;
};

// function traverseObject(obj: t.Expression, scope: Scope) {
//   if (t.isObjectExpression(obj)) {
//     return obj.properties.reduce(
//       (acc, property) => ({
//         ...acc,
//         [property.key.name || property.key.value]:
//           traverseObject(property.value, scope) || null,
//       }),
//       {}
//     );
//   } else if (t.isMemberExpression(obj)) {
//     const object = traverseObject(obj.object, scope);
//     const property = traverseObject(obj.property, scope);
//     return object && property ? object[property] : null;
//   } else if (t.isIdentifier(obj)) {
//     const binding = scope[obj.name];
//     if (binding) {
//       const value = binding.path.node.init;
//       return traverseObject(value, scope);
//     } else {
//       return null;
//     }
//   } else if (t.isCallExpression(obj)) {
//     const callee = traverseObject(obj.callee, scope);
//     const args = obj.arguments.map((arg) => traverseObject(arg, scope));
//     return callee(...args);
//   } else if (t.isStringLiteral(obj)) {
//     return obj.value;
//   } else if (t.isNumericLiteral(obj)) {
//     return obj.value;
//   } else if (t.isBooleanLiteral(obj)) {
//     return obj.value;
//   } else if (t.isNullLiteral(obj)) {
//     return null;
//   } else {
//     return null;
//   }
// }

type Value = string | number | boolean;

interface ObjectValue {
  [key: string]: Value | (() => Value);
}

interface CssObject {
  [key: string]: string | number | CssObject;
}

function traverseObject(
  obj: CssObject,
  scope: Record<string, unknown>
): CssObject {
  const newObj: CssObject = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (typeof value === "function") {
      const { params, body } = value as Function;
      const args: unknown[] = [];
      params.forEach((param) => {
        if (param.type === "Identifier") {
          const paramValue = scope[param.name];
          if (paramValue !== undefined) {
            args.push(paramValue);
          } else {
            throw new Error(`"${param.name}" is not defined`);
          }
        } else {
          throw new Error(`Unsupported parameter type "${param.type}"`);
        }
      });
      newObj[key] = body(...args);
    } else if (typeof value === "object" && value !== null) {
      newObj[key] = traverseObject(value as CssObject, scope);
    } else {
      newObj[key] = value;
    }
  });
  return newObj;
}

// @ts-expect-error
export default declare<State>((api) => {
  api.assertVersion(7);

  return {
    name: packageJson.name,
    pre(file) {
      // this.sheets = {};
      // let cache: Cache;
      // if (this.opts.cache === true) {
      //   globalCache = new Cache();
      //   cache = globalCache;
      // } else {
      //   cache = new Cache();
      // }
      // cache.initialize({ ...this.opts, cache: !!this.opts.cache });
      // this.cache = cache;
      // this.includedFiles = [];
      // this["pathsToCleanup"] = [];
      // state.pathsToCleanup = [];

      this.layerCakeImports = undefined;
      this.pathsToCleanup = [];
      this.scope = collectContext(file.ast);
    },
    visitor: {
      Program: {
        exit(path, state: State) {
          if (!state.layerCakeImports) {
            return;
          }

          // preserveLeadingComments(path);

          // appendRuntimeImports(path);

          // Callback when included files have been added.
          // if (this.includedFiles.length && this.opts.onIncludedFiles) {
          //   this.opts.onIncludedFiles(unique(this.includedFiles));
          // }

          // Cleanup paths that have been marked.
          state.pathsToCleanup.forEach((clean) => {
            switch (clean.action) {
              case "remove": {
                clean.path.remove();
                return;
              }

              case "replace": {
                clean.path.replaceWith(t.nullLiteral());
                return;
              }

              default:
                return;
            }
          });
        },
      },
      // Check import declarations to find out which call expressions are layer cake calls
      ImportDeclaration(path: NodePath<t.ImportDeclaration>, state: State) {
        // If the import is not from the layer cake module, skip it
        if (path.node.source.value !== LAYER_CAKE_MODULE) {
          return;
        }

        state.layerCakeImports = state.layerCakeImports || {};

        // For each import specificer (e.g. `import { style } from "@layer-cake/core"`)
        // check if its a layer cake import, update the state (mapping) and remove the import
        path.get("specifiers").forEach((specifier) => {
          if (
            specifier.isImportSpecifier() &&
            "name" in specifier.node?.imported
          ) {
            const importedName = specifier.node?.imported.name;
            const localName = specifier.node?.local.name || importedName;
            if (importedName === "style") {
              state.layerCakeImports!.style = localName;
              specifier.remove();
            }
            if (importedName === "atoms") {
              state.layerCakeImports!.atoms = localName;
              specifier.remove();
            }
          }
        });

        if (path.node.specifiers.length === 0) {
          path.remove();
        }
      },
      CallExpression(path: NodePath<t.CallExpression>, state: State) {
        if (
          !isLayerCakeStyleCallExpression(path.node, state) &&
          !isLayerCakeAtomsCallExpression(path.node, state)
        ) {
          return;
        }

        // const cssObjectAST = path.node.arguments[0];
        // const evaluate = template.expression("() => VALUE");
        // const cssObject = evaluate({
        //   VALUE: cssObjectAST,
        // }) as t.ArrowFunctionExpression;
        // //.expression();
        // // const className = generateClassName(cssObject);

        // // console.log("cssObject", cssObject);
        // // console.log("className", className);

        // console.log(generate(cssObject.body).code);

        const { node } = path;
        const { callee, arguments: args } = node;
        const cssObject = args[0];

        // const ast = template.expression(`
        //     (function() {
        //       const obj = {};
        //       Object.keys(CSS_OBJECT).forEach(key => {
        //         obj[key] = CSS_OBJECT[key]();
        //       });
        //       return obj;
        //     })()
        //   `)({
        //   CSS_OBJECT: cssObject,
        // });

        // const { code } = generate(ast);

        // console.log(code);

        // const scope = path.scope.getAllBindings();

        const cssObjectAST = cssObject;

        traverse(cssObjectAST, {
          FunctionExpression(path: NodePath<t.FunctionExpression>) {
            const { node } = path;
            const { params, body } = node;
            const newBody = t.arrowFunctionExpression(
              params,
              t.blockStatement([t.returnStatement(body)])
            );
            path.replaceWith(newBody);
          },
        });

        const evaluated = traverseObject(cssObjectFunction, { opacity: 0.5 });

        return;

        // const { node } = path;

        // const context = collectContext(path.scope);
        // const arg = node.arguments[0];

        // const body = cloneDeep(
        //   t.blockStatement([...context, t.returnStatement(arg as t.Expression)])
        // );

        // // traverse(body, {
        // //   noScope: true,
        // //   CallExpression(path) {
        // //     const { node } = path;
        // //     if (node.callee.name === "__e" && node.arguments.length === 1) {
        // //       const arg = node.arguments[0];
        // //       const r = t.valueToNode(JSON.parse(JSON.stringify(arg)));
        // //       path.replaceWith(r);
        // //     }
        // //   },
        // // });

        // // const code = "f = function({t, require}) " + generate(body).code;

        // const code = generate(body).code;

        // console.log(code);
        // console.log("==================================");

        // // @ts-ignore
        // const dn = join(cwd, dirname(path.hub.file.opts.filenameRelative));
        // const f = vm.runInThisContext(code);
        // path.replaceWith(
        //   f({
        //     t,
        //     // @ts-ignore
        //     require(path) {
        //       return require(path[0] === "." ? join(dn, path) : path);
        //     },
        //   })
        // );

        /// =====

        // console.log(
        //   t.objectExpression(
        //     (path.node?.arguments[0] as t.ObjectExpression)?.properties
        //   )
        // );

        // TODO need to eval the object as best we can, this only handles simple (string literal) object
        // let styleObject: Record<string, string> = evaluateExpression(
        //   path.node?.arguments[0] as t.Expression
        // );

        // const className = style({});

        // If this call expression is a layer cake call, remove it
        // We will process this call expression in the Program:exit visitor
        // state.pathsToCleanup.push({ path, action: "replace" });

        // path.replaceWith(t.stringLiteral(className || ""));
      },
    },
  };
});
