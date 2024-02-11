import visitJson from "./index"
import * as json from "./index"

if (cfgTest && process.env.CFG_TEST_FILE === import.meta.filename) {
  const { assert, describe, test } = cfgTest

  describe("src/index.test", () => {
    test("should exports", () => {
      assert.equal(typeof visitJson, "function")
      assert.equal(visitJson, json.visit)
      assert.equal(typeof json.BREAK, "symbol")
    })
  })
}
