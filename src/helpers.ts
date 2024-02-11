export type JsonPrimitive = string | number | boolean | null

export type JsonObject = {
  [key: string]: JsonValue
}

export type JsonArray = JsonValue[]

export type JsonValue = JsonPrimitive | JsonObject | JsonArray

export type JsonPrimitiveLike = JsonPrimitive | undefined

export type JsonObjectLike = {
  [Key in keyof any]?: JsonValueLike | undefined
}

export type JsonArrayLike = JsonValueLike[]

export type JsonValueLike = JsonPrimitiveLike | JsonObjectLike | JsonArrayLike

/**
 * Proceed to the next step without doing anything.
 */
export const PASS = Symbol.for("visit-json.pass")

/**
 * Proceeds without accessing the current object or array element.
 */
export const SKIP = Symbol.for("visit-json.skip")

/**
 * Abort traversal.
 */
export const BREAK = Symbol.for("visit-json.break")

/**
 * Remove the current value. Root will be replaced with `null`.
 */
export const REMOVE = Symbol.for("visit-json.remove")

/**
 * Check if the given value is a plain object.
 *
 * @param o object to check.
 * @returns `true` if the given value is a plain object.
 * @example
 * ```ts
 * const valid = isPlainObject({})
 * console.log(valid) // => true
 *
 * const valid = isPlainObject(Object.create(null))
 * console.log(valid) // => true
 *
 * const invalid = isPlainObject([])
 * console.log(invalid) // => false
 *
 * const invalid = isPlainObject(null)
 * console.log(invalid) // => false
 *
 * const invalid = isPlainObject(new Map())
 * console.log(invalid) // => false
 * ```
 */
export function isPlainObject(o: unknown): o is Record<keyof any, any> {
  return (
    o !== null
    && typeof o === "object"
    && (
      o.constructor === Object // {}
      || o.constructor === undefined // Object.create(null)
    )
  )
}

/**
 * Check if the given value is a JSON primitive.
 *
 * @param o value to check.
 * @returns `true` if the given value is a JSON primitive.
 */
export function isJsonPrimitive(o: unknown): o is JsonPrimitive {
  return o === null
    || typeof o === "string"
    || typeof o === "number"
    || typeof o === "boolean"
}

const AND_BREAK = Symbol("visit-json.and-break")

/**
 * Apply changes and abort traversal.
 *
 * @template T type of the payload.
 */
export type AndBreak<
  T extends JsonValue | typeof REMOVE = JsonValue | typeof REMOVE,
> = {
  readonly keyword: typeof AND_BREAK
  readonly payload: T
}

/**
 * Create an `AndBreak` object.
 *
 * @template T type of the payload.
 * @param payload payload value.
 * @returns `AndBreak` object.
 * @example
 * ```ts
 * const result = andBreak(REMOVE)
 * console.log(result) // => { keyword: Symbol("visit-json.and-break"), payload: Symbol.for("visit-json.remove") }
 *
 * const result = andBreak(0)
 * console.log(result) // => { keyword: Symbol("visit-json.and-break"), payload: 0 }
 * ```
 */
export function andBreak<T extends JsonValue | typeof REMOVE>(
  payload: T,
): AndBreak<T> {
  return Object.freeze({
    keyword: AND_BREAK,
    payload,
  })
}

/**
 * Check if the given value is an `AndBreak` object.
 *
 * @param o object to check.
 * @returns `true` if the given value is an `AndBreak` object.
 * @example
 * ```ts
 * const valid = isAndBreak(andBreak(0))
 * console.log(valid) // => true
 *
 * const invalid = isAndBreak({
 *   keyword: Symbol.for("visit-json.and-break"),
 *   payload: 0,
 * })
 * console.log(invalid) // => false
 * ```
 */
export function isAndBreak(o: unknown): o is AndBreak {
  return isPlainObject(o) && o["keyword"] === AND_BREAK && "payload" in o
}

if (cfgTest && process.env.CFG_TEST_FILE === import.meta.filename) {
  const { assert, describe, test } = cfgTest

  describe("src/helpers", () => {
    describe("constants", () => {
      test("should be unique", () => {
        assert.notEqual(PASS, SKIP)
        assert.notEqual(PASS, BREAK)
        assert.notEqual(PASS, REMOVE)
        assert.notEqual(SKIP, BREAK)
        assert.notEqual(SKIP, REMOVE)
        assert.notEqual(BREAK, REMOVE)
      })
    })

    describe("isPlainObject", () => {
      test("example", () => {
        assert.equal(isPlainObject({}), true)
        assert.equal(isPlainObject(Object.create(null)), true)
        assert.equal(isPlainObject([]), false)
        assert.equal(isPlainObject(null), false)
        assert.equal(isPlainObject(new Map()), false)
      })

      test("should returns true for plain objects", () => {
        assert.equal(isPlainObject({}), true)
        assert.equal(isPlainObject(Object.create(null)), true)
      })

      test("should returns false for non-objects", () => {
        assert.equal(isPlainObject(null), false)
        assert.equal(isPlainObject(0), false)
        assert.equal(isPlainObject(""), false)
        assert.equal(isPlainObject([]), false)
        assert.equal(isPlainObject(new Map()), false)
      })
    })

    describe("andBreak", () => {
      test("should create an AndBreak object", () => {
        const result = andBreak(REMOVE)

        assert.equal(result.keyword, AND_BREAK)
        assert.equal(result.payload, REMOVE)
      })

      test("AndBreak object should be immutable", () => {
        const result = andBreak(REMOVE)

        assert.throws(() => {
          // @ts-expect-error
          result.keyword = Symbol()
        })
        assert.throws(() => {
          // @ts-expect-error
          result.payload = null
        })
        assert.throws(() => {
          // @ts-expect-error
          result.foo = "bar"
        })
        assert.throws(() => {
          // @ts-expect-error
          delete result.keyword
        })
        assert.throws(() => {
          // @ts-expect-error
          delete result.payload
        })
      })
    })

    describe("isAndBreak", () => {
      test("should returns true for AndBreak objects", () => {
        assert.equal(isAndBreak(andBreak(0)), true)
      })

      test("should returns false for non-AndBreak objects", () => {
        assert.equal(
          isAndBreak({
            keyword: Symbol.for("visit-json.and-break"),
            payload: 0,
          }),
          false,
        )
      })
    })
  })
}
