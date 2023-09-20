import createDebug from "debug";
import chalk from "chalk";
import path from "node:path";
import generate from "@babel/generator";

export const formatResourcePath = (i: string) =>
  chalk.blue(`"${path.relative(process.cwd(), i)}"`);

createDebug.formatters.r = (r: string) => formatResourcePath(r);

export const formatAst = (a: any) => generate(a).code;
createDebug.formatters.a = (a: any) => formatAst(a);

export const debug = createDebug;
