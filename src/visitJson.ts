import type {
  AndBreak,
  JsonArray,
  JsonArrayLike,
  JsonObject,
  JsonObjectLike,
  JsonValue,
  JsonValueLike,
} from "./helpers"
import {
  andBreak,
  BREAK,
  isAndBreak,
  isJsonPrimitive,
  isPlainObject,
  PASS,
  REMOVE,
  SKIP,
} from "./helpers"
import type { JsonVisitor, JsonVisitorFn, PathSegment } from "./visitor"

/**
 * Call the given visitor function.
 *
 * @param path path to the value.
 * @param value JSON value.
 * @param parent parent object.
 * @param visitor visitor function.
 * @returns new JSON value or helper object.
 */
function inner(
  path: readonly [PathSegment, ...PathSegment[]] | readonly [],
  value: JsonValueLike,
  parent: JsonArrayLike | JsonObjectLike | null,
  visitor: JsonVisitor,
): AndBreak | JsonValue | typeof REMOVE {
  let x, y

  switch (true) {
    case Array.isArray(value):
      switch (x = visitor.Array?.(value, path, parent)) {
        case PASS:
        case undefined: {
          const acc: JsonArray = []

          for (let idx = 0, len = value.length; idx < len; idx++) {
            y = inner([...path, idx], value[idx], value, visitor)

            if (y === REMOVE) {
              continue
            }

            if (isAndBreak(y)) {
              if (y.payload !== REMOVE) {
                acc.push(y.payload)
              }

              return andBreak([
                ...acc,
                ...value.slice(idx + 1) as JsonArray,
              ])
            }

            acc.push(y)
          }

          return acc
        }

        case SKIP:
          return value as JsonArray

        case BREAK:
          return andBreak(value as JsonArray)

        default:
          return x
      }

    case isPlainObject(value):
      switch (x = visitor.Object?.(value, path, parent)) {
        case PASS:
        case undefined: {
          let acc: JsonObject = {}

          for (const key of Object.keys(value)) {
            y = inner([...path, key], value[key], value, visitor)

            if (y === REMOVE) {
              continue
            }

            if (isAndBreak(y)) {
              acc = {
                ...value as JsonObject,
                ...acc,
              }

              if (y.payload === REMOVE) {
                delete acc[key]
              } else {
                acc[key] = y.payload
              }

              return andBreak(acc)
            }

            acc[key] = y
          }

          return acc
        }

        case SKIP:
          return value as JsonObject

        case BREAK:
          return andBreak(value as JsonObject)

        default:
          return x
      }

    case isJsonPrimitive(value) || value === undefined:
      switch (x = visitor.Primitive?.(value, path, parent)) {
        case SKIP:
        case PASS:
        case undefined:
          return value ?? null

        case BREAK:
          return andBreak(value as JsonValue)

        default:
          return x
      }

    default:
      throw TypeError("Invalid JSON value")
  }
}

/**
 * Traverse JSON and apply changes.
 *
 * @param root top-level JSON value.
 * @param visitor visitor functions.
 * @returns JSON value.
 */
export function visitJson(
  root: JsonValueLike,
  visitor: JsonVisitorFn | JsonVisitor,
): JsonValue {
  if (typeof visitor === "function") {
    visitor = {
      Array: visitor,
      Object: visitor,
      Primitive: visitor,
    }
  }

  if (!visitor.Array && !visitor.Object && !visitor.Primitive) {
    return (root as JsonValue) ?? null
  }

  const x = inner([], root, null, visitor)

  if (x === REMOVE) {
    return null
  }

  if (isAndBreak(x)) {
    return x.payload === REMOVE
      ? null
      : x.payload
  }

  return x
}

if (cfgTest && process.env.CFG_TEST_FILE === import.meta.filename) {
  const { assert, describe, test } = cfgTest

  describe("src/visitJson", () => {
    test("should traverse JSON and apply changes", () => {
      const root = {
        a: {
          b: [
            2,
            "3",
          ],
        },
      }
      const actual = visitJson(root, value => {
        if (typeof value === "number") {
          return value + 2
        }

        return PASS
      })
      const expected = {
        a: {
          b: [
            4,
            "3",
          ],
        },
      }

      assert.deepEqual(actual, expected)
    })

    test("should proceed to the next step without doing anything if the visitor function returns `undefined`", () => {
      const root = {
        a: {
          b: [
            2,
            "3",
          ],
        },
      }
      const actual = visitJson(root, value => {
        if (typeof value === "number") {
          return undefined
        }

        return PASS
      })
      const expected = root

      assert.deepEqual(actual, expected)
      assert.notEqual(actual, root)
    })

    test("should proceeds without accessing the current object or array element if the visitor function returns `SKIP`", () => {
      const root = {
        a: {
          b: [
            2,
            "3",
          ],
          c: {
            d: 4,
          },
        },
      }
      const actual = visitJson(root, {
        Array() {
          return SKIP
        },
        Primitive(value) {
          if (typeof value === "number") {
            return value + 2
          }

          return PASS
        },
      })
      const expected = {
        a: {
          b: [
            2,
            "3",
          ],
          c: {
            d: 6,
          },
        },
      }

      assert.deepEqual(actual, expected)
    })

    test("should abort traversal if the visitor function returns `BREAK`", () => {
      const root = {
        a: {
          b: [
            2,
            "3",
          ],
          c: {
            d: 4,
          },
        },
      }
      const actual = visitJson(root, {
        Array() {
          return BREAK
        },
        Primitive(value) {
          if (typeof value === "number") {
            return value + 2
          }

          return PASS
        },
      })
      const expected = {
        a: {
          b: [
            2,
            "3",
          ],
          c: {
            d: 4,
          },
        },
      }

      assert.deepEqual(actual, expected)
      assert.notEqual(actual, root)
    })

    test("should remove the current value if the visitor function returns `REMOVE`", () => {
      const root = {
        a: {
          b: [
            2,
            "3",
          ],
          c: {
            d: 4,
          },
        },
      }
      const actual = visitJson(root, value => {
        if (typeof value === "number") {
          return REMOVE
        }

        return PASS
      })
      const expected = {
        a: {
          b: [
            "3",
          ],
          c: {},
        },
      }

      assert.deepEqual(actual, expected)
    })

    test("should remove the root if the visitor function returns `REMOVE`", () => {
      const root = {
        a: {
          b: [
            2,
            "3",
          ],
          c: {
            d: 4,
          },
        },
      }
      const actual = visitJson(root, {
        Object() {
          return REMOVE
        },
      })
      const expected = null

      assert.deepEqual(actual, expected)
    })

    test("should remove the current value and abort traversal if the visitor function returns `andBreak(REMOVE)`", () => {
      const root = {
        a: {
          b: [
            2,
            "3",
          ],
          c: {
            d: 4,
          },
        },
      }
      const actual = visitJson(root, {
        Array() {
          return andBreak(REMOVE)
        },
        Primitive(value) {
          if (typeof value === "number") {
            return value + 2
          }

          return PASS
        },
      })
      const expected = {
        a: {
          c: {
            d: 4,
          },
        },
      }

      assert.deepEqual(actual, expected)
    })

    test("should replace the current value and abort traversal if the visitor function returns `andBreak(<value>)`", () => {
      const root = {
        a: {
          b: [
            2,
            "3",
          ],
          c: {
            d: 4,
          },
        },
      }
      const actual = visitJson(root, {
        Array() {
          return andBreak([1, 2, 3])
        },
        Primitive(value) {
          if (typeof value === "number") {
            return value + 2
          }

          return PASS
        },
      })
      const expected = {
        a: {
          b: [
            1,
            2,
            3,
          ],
          c: {
            d: 4,
          },
        },
      }

      assert.deepEqual(actual, expected)
    })
  })
}
