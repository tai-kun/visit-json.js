import type {
  AndBreak,
  JsonArray,
  JsonArrayLike,
  JsonObject,
  JsonObjectLike,
  JsonValue,
  JsonValueLike,
} from "./helpers.js"
import {
  andBreak,
  BREAK,
  isAndBreak,
  isJsonPrimitive,
  isPlainObject,
  PASS,
  REMOVE,
  SKIP,
} from "./helpers.js"
import type { JsonVisitor, JsonVisitorFn, PathSegment } from "./visitor.js"

export interface VisitOptions {
  /**
   * Remove empty arrays.
   *
   * @default false
   */
  readonly removeEmptyArray?: boolean | undefined
  /**
   * Remove empty objects.
   *
   * @default false
   */
  readonly removeEmptyObject?: boolean | undefined
}

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
  visitor: JsonVisitor & VisitOptions,
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

          return visitor.removeEmptyArray && acc.length === 0
            ? REMOVE
            : acc
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
          let hasKey = false

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
            hasKey = true
          }

          return visitor.removeEmptyObject && !hasKey
            ? REMOVE
            : acc
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
 * @param visitor visitor function.
 * @param options options.
 * @returns JSON value.
 */
export function visitJson(
  root: JsonValueLike,
  visitor: JsonVisitorFn,
  options?: VisitOptions | undefined,
): JsonValue

/**
 * Traverse JSON and apply changes.
 *
 * @param root top-level JSON value.
 * @param visitor visitor functions and options.
 * @returns JSON value.
 */
export function visitJson(
  root: JsonValueLike,
  visitor: JsonVisitor & VisitOptions,
): JsonValue

export function visitJson(
  root: JsonValueLike,
  visitor: JsonVisitorFn | (JsonVisitor & VisitOptions),
  options: VisitOptions = {},
): JsonValue {
  if (typeof visitor === "function") {
    visitor = {
      ...options,
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

if (cfgTest && cfgTest.url === import.meta.url) {
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

    test("should remove empty arrays if `options.removeEmptyArray` is `true`", () => {
      const root = {
        a: {
          b: [
            4,
          ],
        },
      }
      const actual = visitJson(root, value => {
        if (value === 4) {
          return REMOVE
        }

        return PASS
      }, {
        removeEmptyArray: true,
      })
      const expected = {
        a: {
          // 4 is removed by the visitor function
          // `b` is removed
        },
      }

      assert.deepEqual(actual, expected)
    })

    test("should remove empty objects if `options.removeEmptyObject` is `true`", () => {
      const root = {
        a: {
          b: {
            c: 4,
          },
        },
      }
      const actual = visitJson(root, {
        Primitive(value) {
          if (value === 4) {
            return REMOVE
          }

          return PASS
        },
        removeEmptyObject: true,
      })
      // `c` is removed by the visitor function
      // `b` is removed
      // `a` is removed
      // The root is removed
      const expected = null

      assert.deepEqual(actual, expected)
    })
  })
}
