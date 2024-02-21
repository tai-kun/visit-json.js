import type { JsonObject } from "type-fest"

import visitJson from "./index.js"
import * as json from "./index.js"

if (cfgTest && cfgTest.url === import.meta.url) {
  const { assert, describe, test } = cfgTest

  describe("src/index.test", () => {
    test("should exports", () => {
      assert.equal(typeof visitJson, "function")
      assert.equal(visitJson, json.visit)
      assert.equal(typeof json.BREAK, "symbol")
    })

    test("types", () => {
      const root: JsonObject = {}
      visitJson(root, () => undefined)
    })
  })
}
