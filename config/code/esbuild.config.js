// @ts-check

import { buildDefine } from "cfg-test/define"
import fs from "node:fs"
import path from "node:path"

/** @type {import("esbuild").BuildOptions[]} */
export default [
  {
    // General

    bundle: true,
    platform: "node",

    // Input

    entryPoints: [
      "src/helpers.ts",
      "src/index.ts",
      "src/visitJson.ts",
    ],

    // Output contents

    format: "esm",
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

    plugins: [autoInsertExtenstion()],
  },
]

/** @param {string} path */
function isLocalFile(path) {
  return path.startsWith(".")
}

/** @type {Record<string, boolean>} */
const cache = {}

/** @param {string} file */
function readOk(file) {
  if (file in cache) {
    return cache[file]
  }

  try {
    fs.accessSync(file, fs.constants.R_OK)

    return cache[file] = true
  } catch {
    return cache[file] = false
  }
}

/**
 * @param {string} dir
 * @param {string} file
 */
function getBuiltPath(dir, file) {
  dir = path.join(dir, file)

  for (const [src, dst] of Object.entries({ ".ts": ".js", ".tsx": ".jsx" })) {
    if (readOk(dir + src)) {
      return file + dst
    }
  }

  return null
}

/** @returns {import("esbuild").Plugin} */
function autoInsertExtenstion() {
  return {
    name: "auto-insert-extension",
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        if (
          args.namespace !== "file"
          || args.kind !== "import-statement"
          || !isLocalFile(args.path)
        ) {
          return null
        }

        const builtPath = getBuiltPath(args.resolveDir, args.path)

        if (!builtPath) {
          return {
            errors: [
              {
                text: `File not found: ${args.path}`,
              },
            ],
          }
        }

        return {
          path: builtPath,
          external: true,
        }
      })
    },
  }
}
