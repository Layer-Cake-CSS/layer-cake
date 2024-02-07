import createDebug from "debug";
import chalk from "chalk";
import path from "node:path";
import generate from "@babel/generator";

export const formatResourcePath = (resourcePath: string) =>
  chalk.blue(`"${path.relative(process.cwd(), resourcePath)}"`);

createDebug.formatters.r = (r: string) => formatResourcePath(r);

export const formatAst = (a: any) => generate(a).code;
createDebug.formatters.a = (a: any) => formatAst(a);

// eslint-disable-next-line unicorn/prefer-export-from
export const debug = createDebug;
