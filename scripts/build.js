// @ts-check

import { build } from "esbuild"
import { exec } from "node:child_process"
import { writeFile } from "node:fs/promises"
import { promisify } from "node:util"
import options from "../config/code/esbuild.config.js"

/**
 * @type {import("typescript").CompilerOptions}
 */
const tsCompilerOptions = {
  noEmit: false,
  declaration: true,
  declarationDir: "dist",
  emitDeclarationOnly: true,
}
await Promise.all(options.map(opts => build(opts)))
await writeFile(
  "tsconfig.build.json",
  JSON.stringify({
    extends: "./tsconfig.json",
    include: [
      "@types/**/*",
      "src/**/*",
    ],
    exclude: [
      "src/**/*.test.ts",
    ],
    compilerOptions: tsCompilerOptions,
  }),
)
await promisify(exec)("npx tsc -p tsconfig.build.json")
