#!/usr/bin/env node
import program from "commander";
import * as pkg from "../package.json";
import func from "./commands/func";
import { configure } from "./logger";
program
  .version(pkg.version)
  .usage("<command> [options]")
  .option("-v, --verbose", "显示详细执行过程");

program.on("option:verbose", () => configure("debug"));

program.parse(process.argv);
if (program.args.length === 0) {
  program.help();
} else {
  func(program.args);
}
