import { parseSync } from "@swc/core";
import toBabel from "swc-to-babel";
import { Binding, NodePath } from "@babel/traverse";
import * as t from "@babel/types";

/**
 * Parse the given source into an AST using SWC and convert to Babel AST
 * @param source
 * @returns
 */
export const parseAst = (source: string) => {
  return toBabel(parseSync(source));
};

/**
 * Collect all bindings that are referenced within the given path
 * @param path
 * @returns
 */

// TODO may need to recurse up the tree to get all bindings (e.g. __webpack_require__)
export function collectScope(path: NodePath<t.Node>) {
  const scope = path.scope;

  // Get bindings that are in scope and are referenced somewhere (easy way to filter out unused bindings)
  const bindings = Object.fromEntries(
    Object.entries(scope.getAllBindings()).filter(([name, binding]) => {
      return binding.referenced && !binding.path.isImportSpecifier();
    })
  ) as Record<string, Binding>;

  // Only include bindings that are referenced within the path
  const includedBindings = Object.fromEntries(
    Object.entries(bindings).filter(([name, binding]) => {
      return (
        binding.referencePaths.filter((referencePath) =>
          referencePath.isDescendant(path)
        ).length > 0
      );
    })
  ) as Record<string, Binding>;

  // TODO - may need to expand coverage from just statements?
  const nodes = Object.entries(includedBindings)
    .map(([name, binding]) => {
      return binding.path.parentPath &&
        t.isStatement(binding.path.parentPath.node)
        ? binding.path.parentPath.node
        : null;
    })
    .filter(Boolean);

  return nodes as Array<
    t.Statement | t.FunctionDeclaration | t.VariableDeclaration
  >;
}
