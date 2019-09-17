import _ from "lodash";
import chalk from "chalk";
import copy from "recursive-copy";
import fs from "fs";
import ora from "ora";
import path from "path";
import prompts from "prompts";
import rimraf from "rimraf";
import through2 from "through2";
import { getLogger } from "../logger";

const logger = getLogger("scaleres");

export default async (args: string[]) => {
  const spanner = ora(`   正在拷贝...... `);
  const src = args[0];
  const dest = args[1];

  spanner.start();
  const options = {
    overwrite: true,
    expand: false,
    dot: false,
    junk: true,
    rename: (filePath: string) => {
      const stat = fs.statSync(path.resolve(src, filePath));
      if (stat.isDirectory()) {
        return "";
      }
      const arr = filePath.split("/");
      return arr.join("-");
    }
  };

  copy(src, dest, options)
    .on(copy.events.COPY_FILE_COMPLETE, copyOperation => {
      spanner.succeed(chalk.green("拷贝文件" + copyOperation.dest));
    })
    .on(copy.events.ERROR, (error, copyOperation) => {
      spanner.fail(chalk.redBright("拷贝文件失败" + copyOperation.dest));
    })
    .then(results => {
      spanner.succeed(chalk.green(`拷贝完成${results.length}个文件`));
    })
    .catch(error => {
      spanner.fail(chalk.redBright(`拷贝失败${error}`));
    });
};
