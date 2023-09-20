import type { CSSObject } from "@layer-cake/core/types";
import type { Adapter } from "@layer-cake/core/adapter";
import { transformCss } from "@layer-cake/core/transform-css";
import traverse, { NodePath } from "@babel/traverse";
import { inspect } from "util";
import * as t from "@babel/types";
import generate from "@babel/generator";
import { importFromStringSync } from "module-from-string";
import { collectScope, parseAst } from "./ast-tools";
import { serializeCss } from "./serialize";
import { DefaultLayerCakeOptions, LayerCakeOptions } from ".";
import { debug, formatAst, formatResourcePath } from "./logger";

export interface ProcessFileOptions {
  source: string;
  filePath: string;
  serializeVirtualCssPath?: (parameters: {
    fileName: string;
    virtualCssPath: string;
    source: string;
    serializedCss: string;
  }) => string;
}

function dbg(message: string, obj: any = null, depth: number = 2) {
  if (!obj && typeof message === "string") {
    console.log(message);
    return;
  }
  if (!obj) {
    console.log(inspect(message, { depth, colors: true }));
    return;
  }
  console.log(message, inspect(obj, { depth, colors: true }));
}

export function evaluateStyleArgument(
  argumentPath: NodePath<t.Node>,
  filePath: string,
  adapter: Adapter
) {
  // This is a VERY naive implementation of evaluating the argument to the call expression
  // Things we need to do still:
  // - Eval the object expression to see which keys/values can be statically evaluated
  // - Replace non-statically evaluated values with CSS Vars & update runtime
  // - Check if the runtime is enabled, and if not error when we cannot statically evaluate

  if (!t.isObjectExpression(argumentPath.node)) {
    return;
  }

  const nodes = collectScope(argumentPath);

  // Generate a new program that exports the result of the call expression
  const output = generate(
    t.program([
      ...nodes,
      t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier("layer_cake_style_argument"),
          argumentPath.node
        ),
      ]),
    ])
  );

  try {
    // Evaluate the program - this will run the call expression and export the result
    const callResult = importFromStringSync(
      `
      import {setAdapter} from "@layer-cake/core/adapter";
      setAdapter(__adapter__);
      import {style} from "@layer-cake/core";
      ${output.code};
      export const value = style(layer_cake_style_argument);`,
      {
        globals: {
          console,
          filname: filePath,
          __adapter__: adapter,
        },
      }
    ) as { value: string };

    const { value: className } = callResult;

    return className;
  } catch (error) {
    return null;
  }
}

export function getLayerCakeReferences(ast: t.File) {
  let layerCakeReferences: Array<{
    localName: string;
    importedName: string;
    path: NodePath<t.Node>;
  }> = [];

  // TODO
  // Current limitations;
  // - Cannot handle reassignment of style function
  // - more?

  // Traverse the AST and collect all imports from @layer-cake/core
  traverse(ast, {
    ImportDeclaration(path) {
      // Quick exit if it a namespace import - not supported
      if (t.isImportNamespaceSpecifier(path.node.specifiers[0])) {
        return;
      }

      // Ignore if it doesn't import from @layer-cake/core
      if (path.node.source.value !== "@layer-cake/core") {
        return;
      }

      const imports = path.node.specifiers
        .filter(
          (
            specifier
          ): specifier is t.ImportDefaultSpecifier | t.ImportSpecifier =>
            !t.isImportNamespaceSpecifier(specifier)
        )
        .map((specifier) => ({
          localName: specifier.local.name,
          importedName: t.isImportDefaultSpecifier(specifier)
            ? "default"
            : // @ts-ignore
              specifier.imported.name,
        }));

      layerCakeReferences = [
        ...layerCakeReferences,
        ...imports.flatMap(({ localName, importedName }) => {
          return (
            path.scope
              .getBinding(localName)
              ?.referencePaths.map((referencePath) => ({
                localName,
                importedName,
                path: referencePath.parentPath!,
              })) ?? []
          );
        }),
      ];
    },
    CallExpression(path) {
      if (
        t.isIdentifier(path.node.callee) &&
        (path.node.callee.name === "require" ||
          path.node.callee.name === "__webpack_require__") &&
        path.node.arguments.length === 1 &&
        t.isStringLiteral(path.node.arguments[0]) &&
        (path.node.arguments[0].value === "@layer-cake/core" ||
          path.node.arguments[0].value.match(
            /\.\.\/\.\.\/packages\/core\/dist\/index/
          )) &&
        t.isVariableDeclarator(path.parentPath?.node)
      ) {
        if (t.isIdentifier(path.parentPath.node.id)) {
          const localName = path.parentPath.node.id.name;
          const references =
            path.scope.getBinding(localName)?.referencePaths || [];

          layerCakeReferences = [
            ...layerCakeReferences,
            ...references.map((referencePath) => ({
              localName,
              importedName: "default",
              path: referencePath.parentPath!,
            })),
          ];
        }
        if (t.isObjectPattern(path.parentPath.node.id)) {
          const imports = path.parentPath.node.id.properties
            .map((property) => {
              if (
                t.isObjectProperty(property) &&
                t.isIdentifier(property.key) &&
                t.isIdentifier(property.value)
              ) {
                return {
                  localName: property.key.name,
                  importedName: t.isIdentifier(property.value)
                    ? property.value.name
                    : "default",
                };
              }
              if (
                t.isRestElement(property) &&
                t.isIdentifier(property.argument)
              ) {
                return {
                  localName: property.argument.name,
                  importedName: "default",
                };
              }
            })
            .filter(Boolean) as Array<{
            localName: string;
            importedName: string;
          }>;

          layerCakeReferences = [
            ...layerCakeReferences,
            ...imports.flatMap(({ localName, importedName }) => {
              return (
                path.scope
                  .getBinding(localName)
                  ?.referencePaths.map((referencePath) => ({
                    localName,
                    importedName,
                    path: referencePath.parentPath!,
                  })) ?? []
              );
            }),
          ];
        }
      }
    },
  });

  return layerCakeReferences;
}

export function identifyPaths(
  layerCakeReferences: ReturnType<typeof getLayerCakeReferences>,
  evaluatePath: (path: NodePath<t.Node>) => void
) {
  layerCakeReferences.forEach(({ importedName, path }) => {
    if (importedName === "style" && t.isCallExpression(path.node)) {
      // Grab the argument to the call expression (e.g. `style({color: 'red'})` => `{color: 'red'}`)
      // const argument = Array.isArray(path.get("arguments")) ? path.get("arguments")[0] : path.get("arguments");
      evaluatePath(path);
    }
    if (
      importedName === "default" &&
      t.isMemberExpression(path.node) &&
      t.isIdentifier(path.node.property) &&
      path.node.property.name === "style" &&
      t.isSequenceExpression(path.parentPath?.node) &&
      t.isCallExpression(path.parentPath?.parentPath?.node)
    ) {
      evaluatePath(path.parentPath?.parentPath!);
    }
  });
}

// bake -> true - perform static evaluation
// bake -> false - do not perform static evaluation
// extract && bake -> true - extract css to file

export function processFile(
  { source, filePath, serializeVirtualCssPath }: ProcessFileOptions,
  {
    extract = DefaultLayerCakeOptions.extract,
    disableRuntime = DefaultLayerCakeOptions.disableRuntime,
  }: LayerCakeOptions = {}
) {
  const log = debug(`layer-cake:processFile:${formatResourcePath(filePath)}`);

  const ast = parseAst(source);

  const layerCakeReferences = getLayerCakeReferences(ast);

  if (!layerCakeReferences.length) {
    log("No Layer Cake References", filePath);
    return source;
  }

  // Now replace call expressions (where possible) with their evaluated value
  // IF runtime is disabled, and cannot statically evaluate, throw an error
  // IF runtime is enabled, and cannot statically evaluate, leave as is
  // If static eval is enabled, and can statically evaluate, replace with evaluated value

  const getArgument = (path: NodePath<t.Node>) => {
    const args = path.get("arguments");
    if (Array.isArray(args)) {
      return args[0];
    }
    return args;
  };

  const localClassNames = new Set<string>();
  let bufferedCSSObjects: Set<CSSObject> = new Set();

  let stringifiedCss = "";

  const staticExtractAdapter: Adapter = {
    appendCss(css: CSSObject) {
      bufferedCSSObjects.add(css);
    },
    registerClassName(className: string) {
      localClassNames.add(className);
    },
    applyCss() {
      stringifiedCss = transformCss(Array.from(bufferedCSSObjects));
    },
  };

  identifyPaths(layerCakeReferences, (path) => {
    const argument = getArgument(path);
    const className = evaluateStyleArgument(
      argument,
      filePath,
      staticExtractAdapter
    );
    if (!className) {
      if (disableRuntime) {
        const argumentFormatted = formatAst(argument.node);
        throw new Error(
          `Could not statically evaluate style call ${argumentFormatted}`
        );
      } else {
        log(`Could not statically evaluate style call %a`, argument.node);
      }
    }
    if (className) {
      path.replaceWith(t.stringLiteral(className));
      log("Replace Style call %a => %s", argument.node, className);
    }
  });

  const output = generate(ast).code;

  if (extract) {
    const fileName = `${filePath}.layerCake.css`;
    const css = stringifiedCss;
    const serializedCss = serializeCss(css);

    let virtualCssPath = `import '${fileName}?source=${serializedCss}';`;

    if (typeof serializeVirtualCssPath === "function") {
      virtualCssPath = serializeVirtualCssPath({
        fileName,
        virtualCssPath,
        source: css,
        serializedCss,
      });
    }

    return `${virtualCssPath}\n${output}`;
  }

  // TODO evaled only CSS needs to be added to output via... a something

  return output;
}
