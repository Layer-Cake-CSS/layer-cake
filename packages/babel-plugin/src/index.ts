import * as t from "@babel/types";
import { NodePath, PluginPass } from "@babel/core";
import { declare } from "@babel/helper-plugin-utils";
import { Scope } from "@babel/traverse";
import traverse from "@babel/traverse";

interface State extends PluginPass {
  // file: {
  //   metadata: {
  //     css?: string;
  //   };
  // };
  scope?: any; // replace `any` with the actual type of `scope` if possible
}

export default declare<State>((api) => {
  api.assertVersion(7);

  return {
    visitor: {
      Program(path: any, state: State) {
        state.scope = path.scope;
        traverse(path.node, {
          FunctionDeclaration(path: any) {
            state.scope = path.scope;
          },
          FunctionExpression(path: any) {
            state.scope = path.scope;
          },
        });
      },
      CallExpression(path: NodePath<t.CallExpression>, state: State) {
        // check if the function being called is `style`
        if ("name" in path.node.callee && path.node.callee.name === "style") {
          // evaluate the argument of the `style` function
          const arg = path.node.arguments[0];
          const evaluated = evalArgument(arg as t.Expression, state);

          // console.log(evaluated);

          // // generate a unique class name based on the evaluated argument
          // const className = generateClassName(evaluated);

          // // replace the `style` function call with a template literal
          // path.replaceWith(
          //   t.templateLiteral([t.templateElement({ raw: `.${className}` })], [])
          // );

          // // add the generated class name to a CSS file
          // addClassNameToCSS(className, evaluated, state);
        }
      },
    },
  };
});

function evalArgument(arg: t.Expression, state: State): any {
  // recursively evaluate the argument of the `style` function
  if (t.isObjectExpression(arg)) {
    return (arg.properties as t.ObjectProperty[]).reduce(
      (acc: any, prop: t.ObjectProperty) => {
        acc[(prop.key as t.Identifier).name] = evalArgument(
          prop.value as t.Expression,
          state
        );
        return acc;
      },
      {}
    );
  } else if (t.isIdentifier(arg)) {
    return state.scope.bindings[arg.name].path.node;
  } else if (t.isCallExpression(arg)) {
    const args = arg.arguments.map((arg) =>
      evalArgument(arg as t.Expression, state)
    );
    const callee = arg.callee as t.Identifier;
    const functionDef = state.scope.bindings[callee.name].path.node;
    let functionParams = "";
    let functionBody = "";
    if (t.isVariableDeclarator(functionDef)) {
      functionParams = (functionDef.init as t.ArrowFunctionExpression).params
        .map((param) => (param as t.Identifier).name)
        .join(",");
      // console.log((functionDef.body as t.BlockStatement).body[0]!)
      console.log(
        "Arrow",
        (
          (functionDef.init as t.ArrowFunctionExpression)
            .body as t.BlockStatement
        ).body
      );
    } else if (t.isFunctionDeclaration(functionDef)) {
      functionParams = functionDef.params
        .map((param) => (param as t.Identifier).name)
        .join(",");
      // functionBody = functionDef.body.body
      //   .map((statement) => statement.source())
      //   .join("");
      console.log("Dec", functionDef.body);
    } else {
      console.log("Other", functionDef);
    }
    // const code = `(${functionParams}) => {${functionBody}}(${args.join(",")})`;
    // return eval(code);
  } else if ("value" in arg) {
    return arg.value;
  } else {
    return;
  }
}

function generateClassName(value: any): string {
  // use your preferred hash function to generate a unique class name
  return JSON.stringify(value);
}

function addClassNameToCSS(className: string, style: any, state: State): void {
  // use your preferred CSS-in-JS library to add the class name and style information to a CSS file
  const css = `.${className} { ${style} }`;
  // state.file.metadata.css = state.file.metadata.css
  //   ? `${state.file.metadata.css}\n${css}`
  //   : css;
}
