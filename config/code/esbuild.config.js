// @ts-check

import { buildDefine } from "cfg-test/define"

/** @type {import("esbuild").BuildOptions[]} */
export default [
  {
    // General

    format: "esm",
    platform: "node",

    // Input

    entryPoints: [
      "src/helpers.ts",
      "src/index.ts",
      "src/visitJson.ts",
    ],

    // Output contents

    lineLimit: 80,

    // Output location

    write: true,
    outdir: "dist",
    outbase: "src",

    // Optimization

    define: buildDefine,
    minifySyntax: true,
    pure: [
      "Symbol",
      "Symbol.for",
    ],
  },
]
