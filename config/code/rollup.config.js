// @ts-check

import replace from "@rollup/plugin-replace"
import typescript from "@rollup/plugin-typescript"
import { buildDefine } from "cfg-test/define"
import { globSync } from "glob"
import path from "node:path"

/** @type {import("rollup").RollupOptions} */
export default {
  input: Object.fromEntries(
    globSync("src/**/*.ts", { ignore: "**/*.test.ts" }).map(file => [
      path.relative(
        "src",
        file.slice(0, file.length - path.extname(file).length),
      ),
      file,
    ]),
  ),
  output: {
    format: "es",
    dir: "dist",
  },
  plugins: [
    replace({
      ...buildDefine,
      preventAssignment: true,
    }),
    typescript({
      outDir: "dist",
      exclude: ["**/*.test.ts"],
      sourceMap: false,
      declaration: true,
    }),
  ],
}
